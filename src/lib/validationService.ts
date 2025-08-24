import axios from 'axios';
import { ParsonsSettings } from '@/@types/types';
import { SolutionRepository } from '@/services/repositories/SolutionRepository';
import { BlockArrangement } from '@/types/domain';
import { validationEngine } from '@/validation/ValidationEngine';
import { DataModelConverter } from '@/types/legacy';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Service for validating Parsons problem solutions and generating feedback
 */
export class ValidationService {
  private apiUrl: string;
  private solutionRepository: SolutionRepository;

  constructor(
    apiUrl: string = API_URL,
    solutionRepository?: SolutionRepository
  ) {
    this.apiUrl = apiUrl;
    this.solutionRepository = solutionRepository || new SolutionRepository();
  }

  /**
   * Validate a solution against a problem
   *
   * @param problemId The ID of the problem to validate against
   * @param solution The user's solution as an array of code lines
   * @returns Promise resolving to the validation result
   */
  async validateSolution(
    problemId: string,
    solution: string[]
  ): Promise<{ isCorrect: boolean; details: string }> {
    try {
      // Convert solution to BlockArrangement format with proper IDs
      // Extract blockIds from the solution strings if they contain IDs
      // or generate new ones if they don't
      const arrangement: BlockArrangement = {
        blocks: solution.map((line, index) => {
          // Try to extract a block ID if it exists in data attributes
          let blockId = `block-${index}`;

          // Check if this is coming from a DOM element with data-block-id
          if (typeof window !== 'undefined') {
            const match = line.match(/data-block-id="([^"]+)"/);
            if (match && match[1]) {
              blockId = match[1];
            }
          }

          return {
            blockId: blockId,
            position: index,
            indentationLevel: (line.length - line.trimStart().length) / 4, // Assuming 4 spaces per indent level
            isInSolution: true,
          };
        }),
        timestamp: Date.now(),
        attemptNumber: 1,
      };

      // Use the repository to validate
      const validationResult = await this.solutionRepository.validate(
        problemId,
        arrangement
      );

      return {
        isCorrect: validationResult.isCorrect,
        details: validationResult.feedback?.content || 'Validation completed',
      };
    } catch (error) {
      console.error('Error validating solution:', error);
      throw new Error('Failed to validate solution');
    }
  }

  /**
   * Validate solution using the unified validation engine
   */
  async validateWithEngine(
    problemSettings: ParsonsSettings,
    userSolution: string[],
    context?: {
      attemptNumber?: number;
      timeSpent?: number;
      previousAttempts?: any[];
    }
  ) {
    try {
      // Convert legacy format to normalized format
      const normalizedProblem =
        this.convertToNormalizedProblem(problemSettings);
      const normalizedSolution = this.convertToNormalizedSolution(userSolution);

      // Use unified validation engine
      const result = await validationEngine.validate({
        problem: normalizedProblem,
        solution: normalizedSolution,
        context: {
          problemId: 'current-problem',
          attemptNumber: context?.attemptNumber || 1,
          timeSpent: context?.timeSpent || 0,
          previousAttempts: context?.previousAttempts || [],
        },
      });

      return result;
    } catch (error) {
      console.error('Error in validation service:', error);

      // Fallback to basic validation
      const basicResult = this.validateSolutionLocally(
        problemSettings,
        userSolution
      );

      return {
        isCorrect: basicResult.isCorrect,
        score: basicResult.isCorrect ? 100 : 50,
        errors: [],
        warnings: [],
        feedback: {
          type: basicResult.isCorrect ? 'success' : 'incorrect',
          summary: basicResult.details,
          details: [],
          nextSteps: [],
        },
        metadata: {
          validatedAt: new Date().toISOString(),
          validationDuration: 0,
          rulesApplied: ['basic'],
          confidence: 0.5,
          version: 'fallback',
        },
      };
    }
  }

  /**
   * Quick validation for real-time feedback
   */
  async quickValidate(
    problemSettings: ParsonsSettings,
    userSolution: string[]
  ) {
    try {
      const normalizedProblem =
        this.convertToNormalizedProblem(problemSettings);
      const normalizedSolution = this.convertToNormalizedSolution(userSolution);

      return validationEngine.quickValidate({
        problem: normalizedProblem,
        solution: normalizedSolution,
        context: {
          problemId: 'current-problem',
          attemptNumber: 1,
          timeSpent: 0,
          previousAttempts: [],
        },
      });
    } catch (error) {
      console.error('Error in quick validation:', error);

      // Fallback to basic validation
      const basicResult = this.validateSolutionLocally(
        problemSettings,
        userSolution
      );
      return {
        isCorrect: basicResult.isCorrect,
        score: basicResult.isCorrect ? 100 : 50,
        errors: [],
      };
    }
  }

  /**
   * Helper method to convert legacy problem settings to normalized format
   */
  private convertToNormalizedProblem(settings: ParsonsSettings) {
    // Temporary converter until DataModelConverter is fully implemented
    // Will be updated in Priority 2B

    // Extract correct lines and distractors
    const lines = settings.initial.split('\n');
    const correctSolution = [];
    const distractors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const isDistractor = line.includes('#distractor');
      const indentLevel = (line.length - line.trimStart().length) / 4;
      const content = line.trim().replace(/#(distractor|paired)\s*$/, '');

      const block = {
        id: `block-${i}`,
        content,
        correctPosition: i,
        correctIndentation: indentLevel,
        groupId: undefined,
        dependencies: [],
        metadata: {
          isOptional: false,
          alternatives: [],
          strictOrder: true,
          validIndentations: [indentLevel],
          concepts: [],
        },
      };

      if (isDistractor) {
        distractors.push(block);
      } else {
        correctSolution.push(block);
      }
    }

    return {
      id: 'current',
      correctSolution,
      distractors,
      options: {
        strictOrder: true,
        allowIndentationErrors: !settings.options.can_indent,
        allowExtraSpaces: true,
        caseSensitive: false,
        validateSyntax: false,
        maxScore: 100,
        partialCredit: true,
      },
      metadata: {
        language: 'python',
        difficulty: 1,
        estimatedTime: 15,
        concepts: [],
      },
    };
  }

  /**
   * Helper method to convert solution to normalized format
   */
  private convertToNormalizedSolution(solution: string[]) {
    return {
      blocks: solution.map((line, index) => ({
        id: `user-block-${index}`,
        content: line.trim(),
        position: index,
        indentationLevel: (line.length - line.trimStart().length) / 4,
        isInSolution: true,
      })),
      timestamp: Date.now(),
    };
  }

  /**
   * Local validation without API call (useful for development or when backend is unavailable)
   * Updated to handle combined blocks properly
   */
  validateSolutionLocally(
    settings: ParsonsSettings,
    solution: string[]
  ): { isCorrect: boolean; details: string } {
    // Extract the correct solution lines from the problem settings
    const initialCode = settings.initial;
    const correctLines: string[] = []; // Process each line in the initial code, handling combined blocks
    for (const line of initialCode.split('\n')) {
      // Skip empty lines
      if (!line.trim()) continue;

      // Skip distractor lines (marked with #distractor)
      if (line.includes('#distractor')) continue;

      // Handle combined blocks (marked with \\n)
      if (line.includes('\\n')) {
        const combinedLines = line.split('\\n');
        for (const combinedLine of combinedLines) {
          if (combinedLine.trim()) {
            // Remove #paired or #distractor comments from combined lines
            const cleanLine = combinedLine
              .replace(/#(paired|distractor)\s*$/, '')
              .trim();
            if (cleanLine) {
              correctLines.push(cleanLine);
            }
          }
        }
      } else {
        // Remove #paired comments from regular lines and add to correct solution
        const cleanLine = line.replace(/#(paired|distractor)\s*$/, '').trim();
        if (cleanLine) {
          correctLines.push(cleanLine);
        }
      }
    }

    // Clean user solution lines and handle multi-line entries
    const cleanedUserSolution: string[] = [];
    for (const solutionLine of solution) {
      if (solutionLine.includes('\n')) {
        // Handle multi-line entries from combined blocks
        const subLines = solutionLine.split('\n');
        for (const subLine of subLines) {
          if (subLine.trim()) {
            cleanedUserSolution.push(subLine.trim());
          }
        }
      } else if (solutionLine.trim()) {
        cleanedUserSolution.push(solutionLine.trim());
      }
    }

    // Check if the solution has the right number of lines
    if (cleanedUserSolution.length !== correctLines.length) {
      return {
        isCorrect: false,
        details: `Your solution has ${cleanedUserSolution.length} lines, but the correct solution has ${correctLines.length} lines.`,
      };
    }

    // Compare each line
    for (let i = 0; i < correctLines.length; i++) {
      if (cleanedUserSolution[i] !== correctLines[i]) {
        return {
          isCorrect: false,
          details: `Line ${i + 1} doesn't match the expected solution.`,
        };
      }
    }

    return {
      isCorrect: true,
      details: 'Your solution is correct!',
    };
  }

  /**
   * Generate Socratic feedback for a solution
   *
   * @param problemId The ID of the problem
   * @param solution The user's solution as an array of code lines
   * @returns Promise resolving to feedback string
   */
  async generateFeedback(
    problemId: string,
    solution: string[]
  ): Promise<string> {
    try {
      const response = await axios.post(`${this.apiUrl}/api/feedback`, {
        problemId,
        userSolution: solution,
      });

      return response.data.feedback;
    } catch (error) {
      console.error('Error generating feedback:', error);
      throw new Error('Failed to generate feedback');
    }
  }

  /**
   * Generate basic feedback locally without API call
   *
   * @param settings The problem settings
   * @param solution The user's solution as an array of code lines
   * @returns Feedback string
   */
  generateLocalFeedback(settings: ParsonsSettings, solution: string[]): string {
    // Validate the solution first
    const validationResult = this.validateSolutionLocally(settings, solution);

    if (validationResult.isCorrect) {
      return 'Great job! Your solution is correct.';
    }

    // Extract the correct solution lines from the problem settings
    const initialCode = settings.initial;
    const correctLines: string[] = [];

    // Process each line in the initial code
    for (const line of initialCode.split('\n')) {
      // Skip empty lines
      if (!line.trim()) continue;

      // Skip distractor lines (marked with #distractor)
      if (line.includes('#distractor')) continue;

      // Add this line to the correct solution
      correctLines.push(line.trim());
    }

    // Clean user solution lines
    const cleanedUserSolution = solution
      .filter((line) => line.trim())
      .map((line) => line.trim());

    // Generate basic feedback based on issues
    if (cleanedUserSolution.length < correctLines.length) {
      return 'Your solution seems to be missing some code blocks. Have you included all the necessary steps?';
    }

    if (cleanedUserSolution.length > correctLines.length) {
      return "Your solution has extra code blocks. Are there any blocks that shouldn't be part of the solution?";
    }

    // Check for specific misplacements
    for (
      let i = 0;
      i < Math.min(cleanedUserSolution.length, correctLines.length);
      i++
    ) {
      if (cleanedUserSolution[i] !== correctLines[i]) {
        // First wrong line
        if (i === 0) {
          return "The first step in your solution doesn't look right. What should the program do first?";
        }

        // Last line is wrong
        if (i === correctLines.length - 1) {
          return "The last step in your solution doesn't look right. How should the program finish?";
        }

        // Check if the error is an indentation issue
        const userLine = cleanedUserSolution[i].trimStart();
        const correctLine = correctLines[i].trimStart();

        if (userLine === correctLine) {
          return `Line ${
            i + 1
          } seems to have incorrect indentation. Think about the code's structure - which blocks should be nested?`;
        }

        // Check if there's a line out of order
        const lineExistsElsewhere = correctLines.some(
          (line) => line.trim() === cleanedUserSolution[i].trim()
        );
        if (lineExistsElsewhere) {
          return `The line "${cleanedUserSolution[
            i
          ].trim()}" appears to be in the wrong position. Where in the logical flow should this operation happen?`;
        }

        // Generic error for wrong line
        return `Line ${
          i + 1
        } doesn't seem right. Think about what operation should happen at this point in the program.`;
      }
    }

    // Generic fallback
    return "There's an issue with your solution. Try to think about the logical flow of the program and the correct order of operations.";
  }
}
