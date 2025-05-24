import { useState, useCallback, useEffect } from 'react';
import { ParsonsSettings } from '@/@types/types';
import {
  AdaptiveState,
  isIndentationProvided,
  identifyPairedDistractors,
  combineBlocks,
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
  incrementAttempts: (isCorrect: boolean) => void;
  triggerAdaptation: () => void;
  createCombinedBlock: (
    blockIds: string[],
    targetArea?: 'blocks' | 'solution' | 'trash'
  ) => void;
  splitCombinedBlock: (combinedBlockId: string) => void;
  applyCombineBlocksAdaptation: () => void;
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

        if (isCombined) {
          subLines = cleanLine.split('\\n').map((subLine) => subLine.trim());
          displayText = `${subLines.length} combined lines`;
        }

        let assignedGroupId: number | undefined;
        let assignedGroupColor: string | undefined;
        let isPairedDistractor = false;

        // Find which group this line belongs to
        const cleanText = isCombined ? subLines![0] : cleanLine.trim();

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
          indentation: 0,
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
    console.log(
      `Instance ${instanceId}: Current settings before toggle:`,
      settings
    );

    setAdaptiveFeaturesEnabled((prev) => {
      const newValue = !prev;
      console.log(
        `Instance ${instanceId}: toggleAdaptiveFeatures() changing from ${prev} to ${newValue}`
      );
      return newValue;
    });
  }, [settings, instanceId]);

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

      // Find the block to move
      let blockToMove: BlockItem | undefined;
      let sourceArray: BlockItem[] = [];

      // Get source array and find block
      switch (fromArea) {
        case 'blocks':
          sourceArray = blocks;
          break;
        case 'solution':
          sourceArray = solution;
          break;
        case 'trash':
          sourceArray = trash;
          break;
      }

      const blockIndex = sourceArray.findIndex((block) => block.id === blockId);
      if (blockIndex === -1) {
        console.error('Block not found:', blockId);
        return;
      }

      blockToMove = sourceArray[blockIndex];

      // Remove from source
      const newSourceArray = [...sourceArray];
      newSourceArray.splice(blockIndex, 1);

      // Get target arrays
      let newBlocks = [...blocks];
      let newSolution = [...solution];
      let newTrash = [...trash];

      // Update source array
      switch (fromArea) {
        case 'blocks':
          newBlocks = newSourceArray;
          break;
        case 'solution':
          newSolution = newSourceArray;
          break;
        case 'trash':
          newTrash = newSourceArray;
          break;
      }

      // Check for group conflicts when moving to solution area
      if (toArea === 'solution') {
        const conflictingBlock = checkGroupConflict(newSolution, blockToMove);

        if (conflictingBlock) {
          console.log('Group conflict detected:', {
            newBlock: blockToMove.id,
            conflictingBlock: conflictingBlock.id,
            groupId: blockToMove.groupId,
          });

          // Resolve conflict by moving conflicting block to trash
          const resolved = resolveGroupConflict(
            conflictingBlock,
            newSolution,
            newTrash
          );
          newSolution = resolved.newSolution;
          newTrash = resolved.newTrash;

          // Show message about conflict resolution
          setAdaptationMessage(
            `Moved conflicting block from Group ${
              (blockToMove.groupId || 0) + 1
            } to trash area. Only one block per group allowed in solution.`
          );
          setTimeout(() => setAdaptationMessage(null), 3000);
        }
      }

      // Add block to target area
      const insertIndex =
        newIndex !== undefined
          ? newIndex
          : toArea === 'solution'
          ? newSolution.length
          : toArea === 'trash'
          ? newTrash.length
          : newBlocks.length;

      switch (toArea) {
        case 'blocks':
          newBlocks.splice(insertIndex, 0, blockToMove);
          break;
        case 'solution':
          newSolution.splice(insertIndex, 0, blockToMove);
          break;
        case 'trash':
          newTrash.splice(insertIndex, 0, blockToMove);
          break;
      }

      // Update all states
      setBlocks(newBlocks);
      setSolution(newSolution);
      setTrash(newTrash);
    },
    [blocks, solution, trash, instanceId]
  );

  const incrementAttempts = useCallback(
    (isCorrect: boolean) => {
      console.log(
        `Instance ${instanceId}: incrementAttempts() called with isCorrect:`,
        isCorrect
      );
      console.log(
        `Instance ${instanceId}: Current settings when incrementing:`,
        settings
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
    [adaptiveState, adaptiveFeaturesEnabled, settings, instanceId]
  );

  const triggerAdaptation = useCallback(() => {
    console.log(`Instance ${instanceId}: triggerAdaptation() called`);
    console.log(
      `Instance ${instanceId}: Current settings when triggering:`,
      settings
    );

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
    isIndentationProvided: settings ? isIndentationProvided(settings) : false,
    initialize,
    cleanup,
    updateSettings,
    toggleAdaptiveFeatures,
    moveBlock,
    incrementAttempts,
    triggerAdaptation,
    createCombinedBlock,
    splitCombinedBlock,
    applyCombineBlocksAdaptation,
  };
};
