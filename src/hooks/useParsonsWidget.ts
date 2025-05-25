import { useState, useCallback, useEffect } from 'react';
import { ParsonsSettings } from '@/@types/types';
import {
  AdaptiveState,
  isIndentationProvided,
  identifyPairedDistractors,
  combineBlocks,
  generateIndentationHints,
} from '@/lib/adaptiveFeatures';
import { adaptiveController } from '@/lib/adaptiveController';

export interface BlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
  originalIndex: number;
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isCombined?: boolean;
  subLines?: string[];
}

export interface IndentationHint {
  lineIndex: number;
  currentIndent: number;
  expectedIndent: number;
  hint: string;
}

export interface UseParsonsWidgetState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  settings: ParsonsSettings | null;
  adaptiveFeaturesEnabled: boolean;
  blocks: BlockItem[];
  solution: BlockItem[];
  trash: BlockItem[];
  adaptiveState: AdaptiveState;
  adaptationMessage: string | null;
  isIndentationProvided: boolean;
  currentIndentationHints: IndentationHint[];
}

export interface UseParsonsWidgetActions {
  initialize: () => void;
  cleanup: () => void;
  updateSettings: (newSettings: ParsonsSettings) => void;
  toggleAdaptiveFeatures: () => void;
  moveBlock: (
    blockId: string,
    fromArea: 'blocks' | 'solution' | 'trash',
    toArea: 'blocks' | 'solution' | 'trash',
    newIndex?: number
  ) => void;
  // NEW: Batch move function
  moveMultipleBlocks: (
    blockIds: string[],
    fromArea: 'blocks' | 'solution' | 'trash',
    toArea: 'blocks' | 'solution' | 'trash'
  ) => void;
  incrementAttempts: (isCorrect: boolean) => void;
  triggerAdaptation: () => void;
  createCombinedBlock: (
    blockIds: string[],
    targetArea?: 'blocks' | 'solution' | 'trash'
  ) => void;
  splitCombinedBlock: (combinedBlockId: string) => void;
  applyCombineBlocksAdaptation: () => void;
  generateCurrentIndentationHints: () => IndentationHint[];
  applyIndentationHint: (blockId: string, lineIndex: number) => void;
  validateCurrentIndentation: () => { isValid: boolean; errors: string[] };
  setBlockIndentation: (blockId: string, newIndentation: number) => void;
  randomizeIndentation: () => void;
}

export interface UseParsonsWidgetReturn
  extends UseParsonsWidgetState,
    UseParsonsWidgetActions {}

// Color palette for groups
const GROUP_COLOR_PALETTE = [
  'border-purple-200 bg-purple-50',
  'border-indigo-200 bg-indigo-50',
  'border-pink-200 bg-pink-50',
  'border-teal-200 bg-teal-50',
  'border-amber-200 bg-amber-50',
];

// Function to get indentation level from a line of code
const getIndentLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  return Math.floor(match[1].length / 4);
};

// Function to assign group colors
const assignGroupColors = (pairedGroups: any[]): Record<number, string> => {
  const groupColors: Record<number, string> = {};

  pairedGroups.forEach((group, index) => {
    groupColors[index] =
      GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length];
  });

  return groupColors;
};

// Function to check for group conflicts in solution area
const checkGroupConflict = (
  solutionBlocks: BlockItem[],
  newBlock: BlockItem
): BlockItem | null => {
  if (newBlock.groupId === undefined) {
    return null; // No group, no conflict
  }

  // Find existing block in solution with same group ID
  const conflictingBlock = solutionBlocks.find(
    (block) => block.groupId === newBlock.groupId && block.id !== newBlock.id
  );

  return conflictingBlock || null;
};

// Function to resolve group conflict by moving conflicting block to trash
const resolveGroupConflict = (
  conflictingBlock: BlockItem,
  solutionBlocks: BlockItem[],
  trashBlocks: BlockItem[]
): { newSolution: BlockItem[]; newTrash: BlockItem[] } => {
  console.log(
    'Resolving group conflict, moving block to trash:',
    conflictingBlock.id
  );

  // Remove conflicting block from solution
  const newSolution = solutionBlocks.filter(
    (block) => block.id !== conflictingBlock.id
  );

  // Find the best position in trash to insert the conflicting block
  // Try to place it adjacent to other blocks from the same group
  const newTrash = [...trashBlocks];

  if (conflictingBlock.groupId !== undefined) {
    // Find other blocks from the same group in trash
    const sameGroupBlocks = trashBlocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => block.groupId === conflictingBlock.groupId);

    if (sameGroupBlocks.length > 0) {
      // Insert adjacent to the last block of the same group
      const lastGroupBlockIndex =
        sameGroupBlocks[sameGroupBlocks.length - 1].index;
      newTrash.splice(lastGroupBlockIndex + 1, 0, conflictingBlock);
    } else {
      // No other group members in trash, add to end
      newTrash.push(conflictingBlock);
    }
  } else {
    // No group, add to end
    newTrash.push(conflictingBlock);
  }

  return { newSolution, newTrash };
};

// Add a global debug counter to track hook instances
let hookInstanceCounter = 0;

export const useParsonsWidget = (): UseParsonsWidgetReturn => {
  // Add instance tracking
  const [instanceId] = useState(() => {
    hookInstanceCounter++;
    console.log(`useParsonsWidget instance ${hookInstanceCounter} created`);
    return hookInstanceCounter;
  });

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ParsonsSettings | null>(null);
  const [adaptiveFeaturesEnabled, setAdaptiveFeaturesEnabled] =
    useState<boolean>(false);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [solution, setSolution] = useState<BlockItem[]>([]);
  const [trash, setTrash] = useState<BlockItem[]>([]);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>(
    adaptiveController.createInitialState()
  );
  const [adaptationMessage, setAdaptationMessage] = useState<string | null>(
    null
  );

  // Computed properties for indentation management
  const isIndentationProvidedValue = settings
    ? settings.options.can_indent === false
    : false;

  const generateCurrentIndentationHints = useCallback((): IndentationHint[] => {
    if (!settings || !solution.length) return [];

    // Get the current solution lines in the exact order they appear in the solution area
    const currentSolutionLines: string[] = [];

    solution.forEach((block) => {
      const indent = '    '.repeat(block.indentation);
      if (block.isCombined && block.subLines) {
        // For combined blocks, add each subline with proper indentation
        block.subLines.forEach((subLine) => {
          currentSolutionLines.push(`${indent}${subLine.trim()}`);
        });
      } else {
        currentSolutionLines.push(`${indent}${block.text}`);
      }
    });

    // Get the expected solution by mapping current solution blocks to their correct lines
    const expectedSolutionLines: string[] = [];
    const correctCodeLines = settings.initial
      .split('\n')
      .filter((line) => line.trim() && !line.includes('#distractor'));

    solution.forEach((block) => {
      if (block.isCombined && block.subLines) {
        // For combined blocks, find the original lines and add them
        block.subLines.forEach((subLine) => {
          const cleanSubLine = subLine.trim();
          // Find the matching line in correct code
          const matchingCorrectLine = correctCodeLines.find(
            (correctLine) => correctLine.trim() === cleanSubLine
          );
          if (matchingCorrectLine) {
            expectedSolutionLines.push(matchingCorrectLine);
          } else {
            // Fallback: preserve the original structure
            expectedSolutionLines.push(subLine);
          }
        });
      } else {
        // For single blocks, find the matching line in correct code
        const cleanBlockText = block.text.trim();
        const matchingCorrectLine = correctCodeLines.find(
          (correctLine) => correctLine.trim() === cleanBlockText
        );
        if (matchingCorrectLine) {
          expectedSolutionLines.push(matchingCorrectLine);
        } else {
          // Fallback: use the block text as-is (for cases where block text might not match exactly)
          expectedSolutionLines.push(block.text);
        }
      }
    });

    // Generate hints by comparing current vs expected indentation
    return generateIndentationHints(
      currentSolutionLines,
      expectedSolutionLines
    );
  }, [settings, solution]);

  const currentIndentationHints = generateCurrentIndentationHints();

  // Debug effect to track settings changes
  useEffect(() => {
    console.log(`Instance ${instanceId}: settings changed to:`, settings);
  }, [settings, instanceId]);

  // Debug effect to track adaptive features changes
  useEffect(() => {
    console.log(
      `Instance ${instanceId}: adaptiveFeaturesEnabled changed to:`,
      adaptiveFeaturesEnabled
    );
  }, [adaptiveFeaturesEnabled, instanceId]);

  const initialize = useCallback(() => {
    console.log(`Instance ${instanceId}: initialize() called`);
  }, [instanceId]);

  const cleanup = useCallback(() => {
    console.log(`Instance ${instanceId}: cleanup() called`);
    setBlocks([]);
    setSolution([]);
    setTrash([]);
    setAdaptiveState(adaptiveController.createInitialState());
    setAdaptationMessage(null);
    setSettings(null);
    setAdaptiveFeaturesEnabled(false);
    setError(null);
  }, [instanceId]);

  const updateSettings = useCallback(
    (newSettings: ParsonsSettings) => {
      console.log(
        `Instance ${instanceId}: updateSettings() called with:`,
        newSettings
      );
      setSettings(newSettings);
      setError(null);

      // Process blocks and assign group information
      const lines = newSettings.initial
        .split('\n')
        .filter((line) => line.trim());

      // Use the existing function to identify paired groups
      const pairedResult = identifyPairedDistractors(newSettings);
      const pairedGroups = pairedResult.pairedGroups;

      // Assign colors to groups
      const groupColors = assignGroupColors(pairedGroups);

      // Process each line and assign group information
      const processedBlocks: BlockItem[] = lines.map((line, index) => {
        const isDistractor = line.includes('#distractor');
        const isPaired = line.includes('#paired');
        const cleanLine =
          isDistractor || isPaired
            ? line.replace(/#(distractor|paired)\s*$/, '')
            : line;

        // Check if this line contains combined blocks (\\n separator)
        const isCombined = cleanLine.includes('\\n');
        let subLines: string[] | undefined;
        let displayText = cleanLine.trimStart();
        let correctIndentation = 0;

        if (isCombined) {
          subLines = cleanLine.split('\\n');
          displayText = `${subLines.length} combined lines`;
          // Use the indentation of the first line in the combined block
          correctIndentation = getIndentLevel(subLines[0]);
        } else {
          // For single lines, preserve original indentation when can_indent is false
          correctIndentation = getIndentLevel(line);
          displayText = cleanLine.trim();
        }

        let assignedGroupId: number | undefined;
        let assignedGroupColor: string | undefined;
        let isPairedDistractor = false;

        // Find which group this line belongs to
        const cleanText = isCombined ? subLines![0].trim() : cleanLine.trim();

        pairedGroups.forEach((group, groupIndex) => {
          group.forEach((item) => {
            const itemText =
              item.distractor === '' ? item.correct : item.distractor;
            if (itemText === cleanText) {
              assignedGroupId = groupIndex;
              assignedGroupColor = groupColors[groupIndex];
              isPairedDistractor = item.distractor !== '';
            }
          });
        });

        return {
          id: `block-${index}`,
          text: displayText,
          // When indentation is provided (can_indent: false), use correct indentation
          indentation:
            newSettings.options.can_indent === false ? correctIndentation : 0,
          isDistractor: isDistractor || isPaired,
          originalIndex: index,
          groupId: assignedGroupId,
          groupColor: assignedGroupColor,
          isPairedDistractor,
          isCombined,
          subLines,
        };
      });

      // Shuffle blocks and set initial state
      const shuffledBlocks = [...processedBlocks].sort(
        () => Math.random() - 0.5
      );

      if (newSettings.options.trashId) {
        setSolution([]);
        setTrash(shuffledBlocks);
      } else {
        setSolution(shuffledBlocks);
        setTrash([]);
      }
      setBlocks([]);
    },
    [instanceId]
  );

  const toggleAdaptiveFeatures = useCallback(() => {
    console.log(`Instance ${instanceId}: toggleAdaptiveFeatures() called`);

    setAdaptiveFeaturesEnabled((prev) => {
      const newValue = !prev;
      console.log(
        `Instance ${instanceId}: toggleAdaptiveFeatures() changing from ${prev} to ${newValue}`
      );
      return newValue;
    });
  }, [instanceId]);

  const setBlockIndentation = useCallback(
    (blockId: string, newIndentation: number) => {
      console.log(`Instance ${instanceId}: setBlockIndentation() called`, {
        blockId,
        newIndentation,
      });

      // Update indentation in all areas
      const updateIndentationInArray = (blocks: BlockItem[]): BlockItem[] => {
        return blocks.map((block) =>
          block.id === blockId
            ? { ...block, indentation: Math.max(0, newIndentation) }
            : block
        );
      };

      setBlocks(updateIndentationInArray);
      setSolution(updateIndentationInArray);
      setTrash(updateIndentationInArray);
    },
    [instanceId]
  );

  const randomizeIndentation = useCallback(() => {
    console.log(`Instance ${instanceId}: randomizeIndentation() called`);

    if (!settings || settings.options.can_indent === false) {
      console.log('Cannot randomize indentation: indentation is provided');
      setAdaptationMessage(
        'Cannot randomize indentation when indentation is provided'
      );
      setTimeout(() => setAdaptationMessage(null), 3000);
      return;
    }

    // Randomize indentation for all solution blocks
    const updatedSolution = solution.map((block) => ({
      ...block,
      indentation: Math.floor(Math.random() * 4), // 0, 1, 2, or 3
    }));

    setSolution(updatedSolution);
    setAdaptationMessage('Randomized indentation for testing');
    setTimeout(() => setAdaptationMessage(null), 2000);
  }, [solution, settings, instanceId]);

  // NEW: Batch move function that handles multiple blocks in a single state update
  const moveMultipleBlocks = useCallback(
    (
      blockIds: string[],
      fromArea: 'blocks' | 'solution' | 'trash',
      toArea: 'blocks' | 'solution' | 'trash'
    ) => {
      console.log(`Instance ${instanceId}: moveMultipleBlocks() called`, {
        blockIds,
        fromArea,
        toArea,
        count: blockIds.length,
      });

      if (blockIds.length === 0) {
        console.warn('No blocks to move');
        return;
      }

      // Get current state snapshots
      let sourceBlocks: BlockItem[] = [];
      let newBlocks = [...blocks];
      let newSolution = [...solution];
      let newTrash = [...trash];

      // Identify source blocks
      switch (fromArea) {
        case 'blocks':
          sourceBlocks = newBlocks;
          break;
        case 'solution':
          sourceBlocks = newSolution;
          break;
        case 'trash':
          sourceBlocks = newTrash;
          break;
      }

      // Find all blocks to move (preserve their order)
      const blocksToMove: BlockItem[] = [];
      blockIds.forEach((blockId) => {
        const block = sourceBlocks.find((b) => b.id === blockId);
        if (block) {
          blocksToMove.push({ ...block }); // Create copy to preserve indentation
        } else {
          console.warn(`Block ${blockId} not found in ${fromArea} area`);
        }
      });

      if (blocksToMove.length === 0) {
        console.warn('No valid blocks found to move');
        return;
      }

      // Remove all blocks to move from source area
      const blocksToMoveIds = new Set(blocksToMove.map((b) => b.id));

      switch (fromArea) {
        case 'blocks':
          newBlocks = newBlocks.filter((b) => !blocksToMoveIds.has(b.id));
          break;
        case 'solution':
          newSolution = newSolution.filter((b) => !blocksToMoveIds.has(b.id));
          break;
        case 'trash':
          newTrash = newTrash.filter((b) => !blocksToMoveIds.has(b.id));
          break;
      }

      // Handle group conflicts if moving to solution area
      const conflictMessages: string[] = [];

      if (toArea === 'solution') {
        // Check for group conflicts and resolve them
        blocksToMove.forEach((blockToMove) => {
          const conflictingBlock = checkGroupConflict(newSolution, blockToMove);

          if (conflictingBlock) {
            console.log('Group conflict detected for block:', blockToMove.id);

            // Resolve conflict by moving conflicting block to trash
            const resolved = resolveGroupConflict(
              conflictingBlock,
              newSolution,
              newTrash
            );
            newSolution = resolved.newSolution;
            newTrash = resolved.newTrash;

            conflictMessages.push(
              `Moved conflicting block from Group ${
                (blockToMove.groupId || 0) + 1
              } to trash`
            );
          }
        });
      }

      // Add all blocks to target area
      switch (toArea) {
        case 'blocks':
          newBlocks.push(...blocksToMove);
          break;
        case 'solution':
          newSolution.push(...blocksToMove);
          break;
        case 'trash':
          newTrash.push(...blocksToMove);
          break;
      }

      // Update all states at once (atomic update)
      setBlocks(newBlocks);
      setSolution(newSolution);
      setTrash(newTrash);

      // Show success message
      let message = `Moved ${blocksToMove.length} block${
        blocksToMove.length > 1 ? 's' : ''
      } from ${fromArea} to ${toArea}`;

      if (conflictMessages.length > 0) {
        message += `. ${conflictMessages.join(', ')}`;
      }

      setAdaptationMessage(message);
      setTimeout(() => setAdaptationMessage(null), 3000);

      console.log(
        `Instance ${instanceId}: Successfully moved ${blocksToMove.length} blocks`
      );
    },
    [blocks, solution, trash, instanceId]
  );

  const moveBlock = useCallback(
    (
      blockId: string,
      fromArea: 'blocks' | 'solution' | 'trash',
      toArea: 'blocks' | 'solution' | 'trash',
      newIndex?: number
    ) => {
      console.log(`Instance ${instanceId}: moveBlock() called`, {
        blockId,
        fromArea,
        toArea,
        newIndex,
      });

      // For single block moves, use the batch move function
      moveMultipleBlocks([blockId], fromArea, toArea);
    },
    [moveMultipleBlocks, instanceId]
  );

  const incrementAttempts = useCallback(
    (isCorrect: boolean) => {
      console.log(
        `Instance ${instanceId}: incrementAttempts() called with isCorrect:`,
        isCorrect
      );

      const newAdaptiveState = adaptiveController.updateStateAfterAttempt(
        adaptiveState,
        isCorrect
      );
      setAdaptiveState(newAdaptiveState);

      // Log when adaptation becomes available (but don't auto-trigger)
      if (
        adaptiveFeaturesEnabled &&
        adaptiveController.shouldTriggerAdaptation(newAdaptiveState)
      ) {
        console.log('Adaptation is now available - user can manually trigger');
        setAdaptationMessage(
          'Adaptive help is now available! Click "Apply Adaptive Help" when you\'re ready.'
        );
      }
    },
    [adaptiveState, adaptiveFeaturesEnabled, instanceId]
  );

  const triggerAdaptation = useCallback(() => {
    console.log(`Instance ${instanceId}: triggerAdaptation() called`);

    if (!settings) {
      console.warn('Cannot trigger adaptation: no settings available');
      setError('No settings available for adaptation');
      return;
    }

    if (!adaptiveFeaturesEnabled) {
      console.warn('Adaptive features are disabled');
      setAdaptationMessage('Adaptive features are disabled');
      return;
    }

    const shouldTrigger =
      adaptiveController.shouldTriggerAdaptation(adaptiveState);
    if (!shouldTrigger) {
      console.log('Adaptation conditions not met');
      setAdaptationMessage('No adaptive changes needed at this time');
      return;
    }

    try {
      const result = adaptiveController.applyAdaptiveFeatures(
        adaptiveState,
        settings
      );

      if (result.success) {
        setSettings(result.newSettings);
        setAdaptiveState(result.newState);
        setAdaptationMessage(result.message);
        console.log('Adaptation applied successfully:', result);

        // Clear message after 5 seconds
        setTimeout(() => setAdaptationMessage(null), 5000);
      } else {
        setAdaptationMessage('No adaptive changes were applied');
        console.log('Adaptation result:', result);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error during adaptation';
      console.error('Error during adaptation:', err);
      setError(errorMessage);
    }
  }, [settings, adaptiveFeaturesEnabled, adaptiveState, instanceId]);

  const createCombinedBlock = useCallback(
    (
      blockIds: string[],
      targetArea: 'blocks' | 'solution' | 'trash' = 'solution'
    ) => {
      console.log(
        `Instance ${instanceId}: createCombinedBlock() called with:`,
        blockIds
      );

      if (blockIds.length < 2) {
        console.warn('Need at least 2 blocks to combine');
        return;
      }

      // Get all blocks from all areas
      const allBlocks = [...blocks, ...solution, ...trash];
      const blocksToMove: BlockItem[] = [];

      // Find blocks to combine
      blockIds.forEach((id) => {
        const block = allBlocks.find((b) => b.id === id);
        if (block) {
          blocksToMove.push(block);
        }
      });

      if (blocksToMove.length !== blockIds.length) {
        console.error('Could not find all blocks to combine');
        return;
      }

      // Sort blocks by their original index to maintain order
      blocksToMove.sort((a, b) => a.originalIndex - b.originalIndex);

      // Create combined block with proper indentation preserved
      const combinedBlock: BlockItem = {
        id: `combined-${Date.now()}`,
        text: `${blocksToMove.length} combined lines`,
        indentation: Math.min(...blocksToMove.map((b) => b.indentation)),
        isDistractor: blocksToMove.some((b) => b.isDistractor),
        originalIndex: Math.min(...blocksToMove.map((b) => b.originalIndex)),
        groupId: blocksToMove[0].groupId,
        groupColor: blocksToMove[0].groupColor,
        isPairedDistractor: blocksToMove.some((b) => b.isPairedDistractor),
        isCombined: true,
        subLines: blocksToMove.map((b) => {
          // Preserve original indentation for each line
          const indentSpaces = '    '.repeat(b.indentation);
          return b.isCombined && b.subLines
            ? b.subLines
                .map((subLine) => indentSpaces + subLine.trim())
                .join('\n')
            : indentSpaces + b.text.trim();
        }),
      };

      // Remove the combined blocks from all areas and add the new combined block
      const blocksToRemove = new Set(blockIds);

      const newBlocks = blocks.filter((b) => !blocksToRemove.has(b.id));
      const newSolution = solution.filter((b) => !blocksToRemove.has(b.id));
      const newTrash = trash.filter((b) => !blocksToRemove.has(b.id));

      // Add combined block to target area
      if (targetArea === 'blocks') {
        newBlocks.push(combinedBlock);
      } else if (targetArea === 'solution') {
        newSolution.push(combinedBlock);
      } else {
        newTrash.push(combinedBlock);
      }

      // Force state update to trigger statistics recalculation
      setBlocks([...newBlocks]);
      setSolution([...newSolution]);
      setTrash([...newTrash]);

      console.log(
        `Instance ${instanceId}: Combined ${blockIds.length} blocks into:`,
        combinedBlock.id
      );
    },
    [blocks, solution, trash, instanceId]
  );

  const splitCombinedBlock = useCallback(
    (combinedBlockId: string) => {
      console.log(
        `Instance ${instanceId}: splitCombinedBlock() called with:`,
        combinedBlockId
      );

      // Find the combined block
      const allBlocks = [...blocks, ...solution, ...trash];
      const combinedBlock = allBlocks.find(
        (block) => block.id === combinedBlockId && block.isCombined
      );

      if (!combinedBlock || !combinedBlock.subLines) {
        console.error('Could not find combined block or block is not combined');
        return;
      }

      // Create individual blocks from subLines, preserving indentation
      const individualBlocks: BlockItem[] = combinedBlock.subLines.map(
        (line, index) => {
          // Extract indentation from the line
          const indentMatch = line.match(/^(\s*)/);
          const indentLevel = indentMatch
            ? Math.floor(indentMatch[1].length / 4)
            : 0;
          const cleanText = line.trim();

          return {
            id: `split-${combinedBlockId}-${index}-${Date.now()}`,
            text: cleanText,
            indentation: indentLevel,
            isDistractor: combinedBlock.isDistractor,
            originalIndex: combinedBlock.originalIndex + index,
            groupId: combinedBlock.groupId,
            groupColor: combinedBlock.groupColor,
            isPairedDistractor: combinedBlock.isPairedDistractor,
            isCombined: false,
          };
        }
      );

      // Determine which area the combined block was in
      let targetArea: 'blocks' | 'solution' | 'trash';
      if (blocks.some((b) => b.id === combinedBlockId)) {
        targetArea = 'blocks';
      } else if (solution.some((b) => b.id === combinedBlockId)) {
        targetArea = 'solution';
      } else {
        targetArea = 'trash';
      }

      // Remove combined block and add individual blocks
      const newBlocks = blocks.filter((b) => b.id !== combinedBlockId);
      const newSolution = solution.filter((b) => b.id !== combinedBlockId);
      const newTrash = trash.filter((b) => b.id !== combinedBlockId);

      // Add individual blocks to the same area where combined block was
      if (targetArea === 'blocks') {
        newBlocks.push(...individualBlocks);
      } else if (targetArea === 'solution') {
        newSolution.push(...individualBlocks);
      } else {
        newTrash.push(...individualBlocks);
      }

      // Force state update to trigger statistics recalculation
      setBlocks([...newBlocks]);
      setSolution([...newSolution]);
      setTrash([...newTrash]);

      console.log(
        `Instance ${instanceId}: Split combined block into ${individualBlocks.length} individual blocks`
      );
    },
    [blocks, solution, trash, instanceId]
  );

  const applyCombineBlocksAdaptation = useCallback(() => {
    console.log(
      `Instance ${instanceId}: applyCombineBlocksAdaptation() called`
    );

    if (!settings) {
      console.warn('No settings available for combining blocks');
      return;
    }

    try {
      // Use the combineBlocks function from adaptiveFeatures
      const result = combineBlocks(settings, 1);

      if (result.success) {
        // Update settings with combined blocks
        updateSettings(result.newSettings);
        console.log('Applied combine blocks adaptation:', result.message);
      } else {
        console.log(
          'Could not apply combine blocks adaptation:',
          result.message
        );
      }
    } catch (error) {
      console.error('Error applying combine blocks adaptation:', error);
    }
  }, [settings, updateSettings, instanceId]);

  const applyIndentationHint = useCallback(
    (blockId: string, lineIndex: number) => {
      console.log(
        `Instance ${instanceId}: applyIndentationHint() called with blockId: ${blockId}, lineIndex: ${lineIndex}`
      );

      if (!settings) {
        console.warn('No settings available for applying indentation hint');
        return;
      }

      const hints = generateCurrentIndentationHints();
      const relevantHint = hints.find((hint) => hint.lineIndex === lineIndex);

      if (!relevantHint) {
        console.warn('No hint found for line index:', lineIndex);
        return;
      }

      // Find which block corresponds to this line index
      let currentLineIndex = 0;
      let targetBlockIndex = -1;

      for (let i = 0; i < solution.length; i++) {
        const block = solution[i];
        let blockLineCount = 1;

        if (block.isCombined && block.subLines) {
          blockLineCount = block.subLines.length;
        }

        if (
          lineIndex >= currentLineIndex &&
          lineIndex < currentLineIndex + blockLineCount
        ) {
          targetBlockIndex = i;
          break;
        }

        currentLineIndex += blockLineCount;
      }

      if (targetBlockIndex === -1) {
        console.warn('Could not find block for line index:', lineIndex);
        return;
      }

      // Apply the correct indentation to the block
      const updatedSolution = [...solution];
      updatedSolution[targetBlockIndex] = {
        ...updatedSolution[targetBlockIndex],
        indentation: relevantHint.expectedIndent,
      };

      setSolution(updatedSolution);
      console.log(
        `Applied indentation hint: set block at index ${targetBlockIndex} to indent level ${relevantHint.expectedIndent}`
      );
    },
    [solution, settings, generateCurrentIndentationHints, instanceId]
  );

  const validateCurrentIndentation = useCallback((): {
    isValid: boolean;
    errors: string[];
  } => {
    const hints = generateCurrentIndentationHints();
    const errors = hints.map(
      (hint) =>
        `Line ${hint.lineIndex + 1}: Expected indent ${
          hint.expectedIndent
        }, got ${hint.currentIndent}`
    );

    return {
      isValid: hints.length === 0,
      errors,
    };
  }, [generateCurrentIndentationHints]);

  return {
    isInitialized,
    isLoading,
    error,
    settings,
    adaptiveFeaturesEnabled,
    blocks,
    solution,
    trash,
    adaptiveState,
    adaptationMessage,
    isIndentationProvided: isIndentationProvidedValue,
    currentIndentationHints,
    initialize,
    cleanup,
    updateSettings,
    toggleAdaptiveFeatures,
    moveBlock,
    moveMultipleBlocks, // NEW: Export the batch move function
    incrementAttempts,
    triggerAdaptation,
    createCombinedBlock,
    splitCombinedBlock,
    applyCombineBlocksAdaptation,
    generateCurrentIndentationHints,
    applyIndentationHint,
    validateCurrentIndentation,
    setBlockIndentation,
    randomizeIndentation,
  };
};
