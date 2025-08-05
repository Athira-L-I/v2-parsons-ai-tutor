/**
 * Legacy types for backward compatibility during migration
 * These map old structures to new normalized models
 */

import {
  Problem,
  CodeBlock,
  ValidationResult,
  ChatMessage,
  AdaptiveState,
  BlockArrangement,
  AdaptiveHelp,
  MessageType
} from './domain';

// Legacy frontend types (maintain for compatibility)
export interface LegacyParsonsSettings {
  initial: string;
  options: {
    sortableId: string;
    trashId: string;
    max_wrong_lines: number;
    can_indent: boolean;
    grader: string;
    exec_limit: number;
    show_feedback: boolean;
  };
}

export interface LegacyBlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
  originalIndex?: number;
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isCombined?: boolean;
  subLines?: string[];
}

export interface LegacyChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'typing';
  content: string;
  timestamp: number;
}

export interface LegacyAdaptiveState {
  attempts: number;
  incorrectAttempts: number;
  combinedBlocks: number;
  removedDistractors: number;
}

// Conversion utilities
export class DataModelConverter {
  /**
   * Convert legacy ParsonsSettings to normalized Problem structure
   */
  static legacySettingsToProblem(
    settings: LegacyParsonsSettings,
    metadata: {
      id: string;
      title: string;
      description: string;
    }
  ): Problem {
    const codeLines = settings.initial.split('\n').filter(line => line.trim());
    const correctBlocks: CodeBlock[] = [];
    const distractors: CodeBlock[] = [];

    codeLines.forEach((line, index) => {
      const block: CodeBlock = {
        id: `block-${index}`,
        content: line.replace(/#(distractor|paired).*$/, '').trim(),
        indentationLevel: (line.length - line.trimStart().length) / 4,
        position: index,
        metadata: {
          isDistractor: line.includes('#distractor'),
          difficulty: 1,
          concepts: [],
          hints: [],
          correctPosition: line.includes('#distractor') ? undefined : index,
        },
      };

      if (block.metadata.isDistractor) {
        distractors.push(block);
      } else {
        correctBlocks.push(block);
      }
    });

    return {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      difficulty: 'intermediate',
      tags: [],
      metadata: {
        language: 'python',
        concepts: [],
        prerequisites: [],
        isPublic: true,
        version: 1,
      },
      codeStructure: {
        correctSolution: correctBlocks,
        distractors: distractors,
        combinedBlocks: [],
        options: {
          canIndent: settings.options.can_indent,
          maxWrongLines: settings.options.max_wrong_lines,
          showFeedback: settings.options.show_feedback,
          executionLimit: settings.options.exec_limit,
          gradingMethod: 'line_based',
          adaptiveFeatures: {
            enabled: false,
            triggerThresholds: {
              incorrectAttempts: 3,
              timeSpentMinutes: 0,
              helpRequests: 2,
            },
            availableHelp: ['combine_blocks', 'remove_distractors'],
          },
        },
      },
      educationalObjectives: [],
      estimatedTimeMinutes: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Convert normalized Problem back to legacy ParsonsSettings
   */
  static problemToLegacySettings(problem: Problem): LegacyParsonsSettings {
    const allBlocks = [
      ...problem.codeStructure.correctSolution,
      ...problem.codeStructure.distractors,
    ].sort((a, b) => a.position - b.position);

    const initial = allBlocks
      .map(block => {
        const indent = '    '.repeat(block.indentationLevel);
        const suffix = block.metadata.isDistractor ? ' #distractor' : '';
        return `${indent}${block.content}${suffix}`;
      })
      .join('\n');

    return {
      initial,
      options: {
        sortableId: 'sortable',
        trashId: 'sortableTrash',
        max_wrong_lines: problem.codeStructure.options.maxWrongLines,
        can_indent: problem.codeStructure.options.canIndent,
        grader: 'ParsonsWidget._graders.LineBasedGrader',
        exec_limit: problem.codeStructure.options.executionLimit,
        show_feedback: problem.codeStructure.options.showFeedback,
      },
    };
  }

  /**
   * Convert legacy BlockItem array to normalized BlockArrangement
   */
  static legacyBlocksToArrangement(blocks: LegacyBlockItem[]): BlockArrangement {
    return {
      blocks: blocks.map((block, index) => ({
        blockId: block.id,
        position: index,
        indentationLevel: block.indentation,
        isInSolution: true,
      })),
      timestamp: Date.now(),
      attemptNumber: 1,
    };
  }

  /**
   * Convert normalized BlockArrangement to legacy BlockItem array
   */
  static arrangementToLegacyBlocks(
    arrangement: BlockArrangement,
    problem: Problem
  ): LegacyBlockItem[] {
    return arrangement.blocks.map(arrangedBlock => {
      const codeBlock = problem.codeStructure.correctSolution
        .find(block => block.id === arrangedBlock.blockId) ||
        problem.codeStructure.distractors
        .find(block => block.id === arrangedBlock.blockId);

      if (!codeBlock) {
        throw new Error(`Block ${arrangedBlock.blockId} not found in problem`);
      }

      return {
        id: codeBlock.id,
        text: codeBlock.content,
        indentation: arrangedBlock.indentationLevel,
        isDistractor: codeBlock.metadata.isDistractor,
        originalIndex: codeBlock.position,
        groupId: codeBlock.groupId ? parseInt(codeBlock.groupId) : undefined,
      };
    });
  }

  /**
   * Convert legacy ChatMessage to normalized ChatMessage
   */
  static legacyChatToNormalized(legacyMessage: LegacyChatMessage): ChatMessage {
    return {
      id: legacyMessage.id,
      type: legacyMessage.type as MessageType, // Type conversion
      content: legacyMessage.content,
      sender: legacyMessage.type === 'user' ? 'user' : 'ai_tutor',
      metadata: {
        isGenerated: legacyMessage.type === 'ai',
        context: {
          problemId: 'unknown',
          userState: {
            attempts: 0,
            timeSpent: 0,
            frustrationLevel: 0
          }
        },
      },
      reactions: [],
      createdAt: new Date(legacyMessage.timestamp).toISOString(),
      updatedAt: new Date(legacyMessage.timestamp).toISOString(),
    };
  }

  /**
   * Convert legacy AdaptiveState to normalized AdaptiveState
   */
  static legacyAdaptiveToNormalized(
    legacyState: LegacyAdaptiveState
  ): AdaptiveState {
    return {
      attempts: legacyState.attempts,
      incorrectAttempts: legacyState.incorrectAttempts,
      timeSpent: 0, // Not tracked in legacy
      hintsUsed: [],
      appliedHelps: [],
      currentDifficulty: 1.0,
      learningVelocity: 1.0,
    };
  }
}
