import { useState, useCallback } from 'react';
import { ParsonsSettings } from '@/@types/types';
import { AdaptiveState, isIndentationProvided } from '@/lib/adaptiveFeatures';
import { adaptiveController } from '@/lib/adaptiveController';

export interface BlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
  originalIndex: number;
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

export const useParsonsWidget = (): UseParsonsWidgetReturn => {
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

  const initialize = useCallback(() => {
    // Empty for now - will be implemented later
    console.log('useParsonsWidget: initialize() called');
  }, []);

  const cleanup = useCallback(() => {
    console.log('useParsonsWidget: cleanup() called');
    setBlocks([]);
    setSolution([]);
    setTrash([]);
    setAdaptiveState(adaptiveController.createInitialState());
    setAdaptationMessage(null);
  }, []);

  const updateSettings = useCallback((newSettings: ParsonsSettings) => {
    setSettings(newSettings);
    console.log('useParsonsWidget: updateSettings() called with:', newSettings);
  }, []);

  const toggleAdaptiveFeatures = useCallback(() => {
    setAdaptiveFeaturesEnabled((prev) => {
      const newValue = !prev;
      console.log(
        'useParsonsWidget: toggleAdaptiveFeatures() called, new value:',
        newValue
      );
      return newValue;
    });
  }, []);

  const moveBlock = useCallback(
    (
      blockId: string,
      fromArea: 'blocks' | 'solution' | 'trash',
      toArea: 'blocks' | 'solution' | 'trash',
      newIndex?: number
    ) => {
      console.log('useParsonsWidget: moveBlock() called', {
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
    [blocks, solution, trash]
  );

  const incrementAttempts = useCallback(
    (isCorrect: boolean) => {
      console.log(
        'useParsonsWidget: incrementAttempts() called with isCorrect:',
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
          'Adaptive help is now available! Click "Trigger Adaptation" when you\'re ready.'
        );
      }
    },
    [adaptiveState, adaptiveFeaturesEnabled]
  );

  const triggerAdaptation = useCallback(() => {
    console.log('useParsonsWidget: triggerAdaptation() called');

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
  }, [settings, adaptiveFeaturesEnabled, adaptiveState]);

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
