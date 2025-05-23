import { useState, useCallback, useEffect } from 'react';
import { ParsonsSettings } from '@/@types/types';
import {
  AdaptiveState,
  isIndentationProvided,
  identifyPairedDistractors,
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
}

export interface UseParsonsWidgetReturn
  extends UseParsonsWidgetState,
    UseParsonsWidgetActions {}

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

      // Process blocks and assign group information using adaptiveFeatures logic
      const lines = newSettings.initial
        .split('\n')
        .filter((line) => line.trim());

      // Group colors for paired distractors
      const groupColors = [
        'border-purple-200 bg-purple-50',
        'border-indigo-200 bg-indigo-50',
        'border-pink-200 bg-pink-50',
        'border-teal-200 bg-teal-50',
        'border-amber-200 bg-amber-50',
      ];

      // Use the existing function to identify paired groups
      const pairedResult = identifyPairedDistractors(newSettings);
      const pairedGroups = pairedResult.pairedGroups;

      // Process each line and assign group information
      const processedBlocks: BlockItem[] = lines.map((line, index) => {
        const isDistractor = line.includes('#distractor');
        const isPaired = line.includes('#paired');
        const cleanLine =
          isDistractor || isPaired
            ? line.replace(/#(distractor|paired)\s*$/, '')
            : line;

        let assignedGroupId: number | undefined;
        let assignedGroupColor: string | undefined;
        let isPairedDistractor = false;

        // Find which group this line belongs to
        const cleanText = cleanLine.trim();

        pairedGroups.forEach((group, groupIndex) => {
          group.forEach((item) => {
            const itemText =
              item.distractor === '' ? item.correct : item.distractor;
            if (itemText === cleanText) {
              assignedGroupId = groupIndex;
              assignedGroupColor = groupColors[groupIndex % groupColors.length];
              isPairedDistractor = item.distractor !== ''; // It's a distractor if distractor field is not empty
            }
          });
        });

        return {
          id: `block-${index}`,
          text: cleanLine.trimStart(),
          indentation: 0,
          isDistractor: isDistractor || isPaired,
          originalIndex: index,
          groupId: assignedGroupId,
          groupColor: assignedGroupColor,
          isPairedDistractor,
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

      // Add to destination
      const getTargetArray = (area: 'blocks' | 'solution' | 'trash') => {
        switch (area) {
          case 'blocks':
            return blocks;
          case 'solution':
            return solution;
          case 'trash':
            return trash;
        }
      };

      const targetArray = [...getTargetArray(toArea)];
      const insertIndex =
        newIndex !== undefined ? newIndex : targetArray.length;
      targetArray.splice(insertIndex, 0, blockToMove);

      // Update states
      switch (fromArea) {
        case 'blocks':
          setBlocks(newSourceArray);
          break;
        case 'solution':
          setSolution(newSourceArray);
          break;
        case 'trash':
          setTrash(newSourceArray);
          break;
      }

      switch (toArea) {
        case 'blocks':
          setBlocks(targetArray);
          break;
        case 'solution':
          setSolution(targetArray);
          break;
        case 'trash':
          setTrash(targetArray);
          break;
      }
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
  };
};
