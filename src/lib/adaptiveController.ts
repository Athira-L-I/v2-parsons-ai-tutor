import { ParsonsSettings } from '@/@types/types';
import {
  combineBlocks,
  removeDistractors,
  identifyPairedDistractors,
  provideIndentation,
  AdaptiveState,
  BlockCombineResult,
  PairedDistractorResult,
  IndentationResult,
  DistractorRemovalResult,
} from './adaptiveFeatures';

export interface AdaptiveAction {
  type:
    | 'combine'
    | 'remove_distractors'
    | 'provide_indentation'
    | 'identify_pairs';
  priority: number;
  description: string;
  condition: (state: AdaptiveState, settings: ParsonsSettings) => boolean;
}

export interface AdaptiveApplicationResult {
  success: boolean;
  newSettings: ParsonsSettings;
  newState: AdaptiveState;
  actionsApplied: string[];
  message: string;
}

/**
 * Main adaptive controller that manages difficulty adjustments
 */
export class AdaptiveController {
  private actions: AdaptiveAction[] = [
    {
      type: 'identify_pairs',
      priority: 1,
      description: 'Group related distractors',
      condition: (state, settings) =>
        state.attempts >= 2 && this.hasUnpairedDistractors(settings),
    },
    {
      type: 'remove_distractors',
      priority: 2,
      description: 'Remove distractor blocks',
      condition: (state, settings) =>
        state.incorrectAttempts >= 3 && this.hasDistractors(settings),
    },
    {
      type: 'provide_indentation',
      priority: 3,
      description: 'Provide correct indentation',
      condition: (state, settings) =>
        state.incorrectAttempts >= 4 && settings.options.can_indent === true, // Changed this line
    },
    {
      type: 'combine',
      priority: 4,
      description: 'Combine adjacent blocks',
      condition: (state, settings) =>
        state.incorrectAttempts >= 5 && this.canCombineBlocks(settings),
    },
  ];

  /**
   * Applies adaptive features based on student performance
   */
  applyAdaptiveFeatures(
    currentState: AdaptiveState,
    settings: ParsonsSettings
  ): AdaptiveApplicationResult {
    // Sort actions by priority
    const sortedActions = this.actions.sort((a, b) => a.priority - b.priority);

    let newSettings = { ...settings };
    const newState = { ...currentState };
    const actionsApplied: string[] = [];

    // Apply all applicable actions
    for (const action of sortedActions) {
      if (action.condition(newState, newSettings)) {
        const result = this.applyAction(action, newSettings);

        if (result.success) {
          newSettings = result.newSettings;
          actionsApplied.push(action.description);

          // Update state based on action type
          switch (action.type) {
            case 'combine':
              newState.combinedBlocks +=
                (result as BlockCombineResult).combinedBlocks || 0;
              break;
            case 'remove_distractors':
              newState.removedDistractors +=
                (result as DistractorRemovalResult).removedDistractors || 0; // Use DistractorRemovalResult and its property
              break;
            case 'provide_indentation':
              // No state change in AdaptiveState for this, it modifies ParsonsSettings
              break;
            // It's good practice to handle 'identify_pairs' if it modifies adaptive state, though it currently doesn't seem to.
            // case 'identify_pairs':
            //   // Potentially update state if identify_pairs had an effect on AdaptiveState, e.g., newState.pairsIdentified = true;
            //   break;
          }
        }
      }
    }

    return {
      success: actionsApplied.length > 0,
      newSettings,
      newState,
      actionsApplied,
      message:
        actionsApplied.length > 0
          ? `Applied adaptive features: ${actionsApplied.join(', ')}`
          : 'No adaptive features were needed at this time',
    };
  }

  /**
   * Applies a specific adaptive action
   */
  private applyAction(
    action: AdaptiveAction,
    settings: ParsonsSettings
  ):
    | BlockCombineResult
    | PairedDistractorResult
    | IndentationResult
    | DistractorRemovalResult {
    // Added DistractorRemovalResult to return type
    switch (action.type) {
      case 'combine':
        return combineBlocks(settings, 1);

      case 'remove_distractors':
        return removeDistractors(settings, 2); // This returns DistractorRemovalResult

      case 'provide_indentation':
        return provideIndentation(settings);

      case 'identify_pairs':
        return identifyPairedDistractors(settings);

      default:
        // It's better to throw an error for an unhandled action type
        // or return a more specific error structure if preferred.
        throw new Error(`Unknown action type: ${action.type}`);
      // return {
      //   success: false,
      //   newSettings: settings,
      //   message: `Unknown action type: ${(action as any).type}`,
      // } as any; // Avoid using 'as any' if possible
    }
  }

  /**
   * Determines if the problem has unpaired distractors
   */
  private hasUnpairedDistractors(settings: ParsonsSettings): boolean {
    const lines = settings.initial.split('\\n');
    // Check if any line has #distractor but not #paired
    return lines.some(
      (line) => line.includes('#distractor') && !line.includes('#paired')
    );
  }

  /**
   * Determines if the problem has any distractors
   */
  private hasDistractors(settings: ParsonsSettings): boolean {
    return (
      settings.initial.includes('#distractor') ||
      settings.initial.includes('#paired')
    );
  }

  /**
   * Determines if blocks can be combined
   */
  private canCombineBlocks(settings: ParsonsSettings): boolean {
    const solutionLines = settings.initial
      .split('\n')
      .filter(
        (line) =>
          line.trim() &&
          !line.includes('#distractor') &&
          !line.includes('#paired')
      );

    return solutionLines.length > 3;
  }

  /**
   * Creates initial adaptive state
   */
  createInitialState(): AdaptiveState {
    return {
      attempts: 0,
      incorrectAttempts: 0,
      combinedBlocks: 0,
      removedDistractors: 0,
    };
  }

  /**
   * Updates adaptive state after a student attempt
   */
  updateStateAfterAttempt(
    state: AdaptiveState,
    isCorrect: boolean
  ): AdaptiveState {
    return {
      ...state,
      attempts: state.attempts + 1,
      incorrectAttempts: isCorrect
        ? state.incorrectAttempts
        : state.incorrectAttempts + 1,
    };
  }

  /**
   * Determines if adaptive features should be triggered
   */
  shouldTriggerAdaptation(state: AdaptiveState): boolean {
    // Trigger adaptation after multiple incorrect attempts
    return state.incorrectAttempts >= 2;
  }

  /**
   * Gets available adaptive actions for current state
   */
  getAvailableActions(
    state: AdaptiveState,
    settings: ParsonsSettings
  ): AdaptiveAction[] {
    return this.actions.filter((action) => action.condition(state, settings));
  }

  /**
   * Generates adaptation suggestions for display
   */
  generateAdaptationSuggestions(
    state: AdaptiveState,
    settings: ParsonsSettings
  ): string[] {
    const availableActions = this.getAvailableActions(state, settings);

    if (availableActions.length === 0) {
      return ["Continue practicing! You're making progress."];
    }

    const suggestions = [
      `After ${state.incorrectAttempts} incorrect attempts, we can help by:`,
    ];

    availableActions.forEach((action) => {
      suggestions.push(`• ${action.description}`);
    });

    return suggestions;
  }
}

/**
 * Default adaptive controller instance
 */
export const adaptiveController = new AdaptiveController();

/**
 * Helper function to apply adaptive features automatically
 */
export function autoApplyAdaptiveFeatures(
  attempts: number,
  incorrectAttempts: number,
  settings: ParsonsSettings
): AdaptiveApplicationResult {
  const state: AdaptiveState = {
    attempts,
    incorrectAttempts,
    combinedBlocks: 0,
    removedDistractors: 0,
    // indentationProvided: false, // This field is not in the AdaptiveState interface
  };

  return adaptiveController.applyAdaptiveFeatures(state, settings);
}
