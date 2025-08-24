import {
  ValidationRule,
  ValidationInput,
  ValidationRuleResult,
  ValidationError,
  ValidationErrorType,
} from '../types';

export class CompletenessValidationRule implements ValidationRule {
  name = 'completeness-validation';
  priority = 9;
  category = 'completeness' as const;

  async validate(input: ValidationInput): Promise<ValidationRuleResult> {
    const errors: ValidationError[] = [];
    let score = 100;

    // Check for incomplete solution (not all required blocks are used)
    const requiredBlocks = input.problem.correctSolution
      .filter((block) => !block.metadata.isOptional)
      .map((block) => block.id);

    const userBlocks = input.solution.blocks
      .filter((block) => block.isInSolution)
      .map((block) => block.id);

    // Find missing required blocks
    const missingBlocks = requiredBlocks.filter(
      (id) => !userBlocks.includes(id)
    );

    if (missingBlocks.length > 0) {
      errors.push({
        type: 'incomplete_solution' as ValidationErrorType,
        severity: 'critical',
        expectedValue: `${requiredBlocks.length} required blocks`,
        actualValue: `${requiredBlocks.length - missingBlocks.length} of ${
          requiredBlocks.length
        } required blocks used`,
        message: `Your solution is incomplete. You are missing ${
          missingBlocks.length
        } required block${missingBlocks.length > 1 ? 's' : ''}.`,
        suggestion: 'Ensure all needed code blocks are used in your solution.',
      });

      // Penalize score for missing blocks
      score = Math.max(0, 100 - missingBlocks.length * 25);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
      score,
      confidence: 0.95,
    };
  }
}
