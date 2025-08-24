import {
  ValidationRule,
  ValidationInput,
  ValidationRuleResult,
  ValidationError,
  ValidationWarning,
  ValidationErrorType,
} from '../types';

export class IndentationValidationRule implements ValidationRule {
  name = 'indentation-validation';
  priority = 8;
  category = 'indentation' as const;

  async validate(input: ValidationInput): Promise<ValidationRuleResult> {
    if (!input.problem.options.allowIndentationErrors) {
      // If indentation errors are not allowed, treat them as critical
      return this.validateStrict(input);
    } else {
      // If indentation errors are allowed, treat them as warnings
      return this.validateLenient(input);
    }
  }

  private async validateStrict(
    input: ValidationInput
  ): Promise<ValidationRuleResult> {
    const errors: ValidationError[] = [];
    let score = 100;

    // Check each block's indentation
    for (const userBlock of input.solution.blocks) {
      if (!userBlock.isInSolution) continue;

      const correctBlock = input.problem.correctSolution.find(
        (block) => block.id === userBlock.id
      );

      if (!correctBlock) continue; // Skip distractors

      const expectedIndent = correctBlock.correctIndentation;
      const actualIndent = userBlock.indentationLevel;

      if (expectedIndent !== actualIndent) {
        errors.push({
          type: 'wrong_indentation' as ValidationErrorType,
          severity: 'major',
          blockId: userBlock.id,
          expectedValue: expectedIndent,
          actualValue: actualIndent,
          position: userBlock.position,
          message: `Incorrect indentation for "${userBlock.content}"`,
          suggestion: `This line should be indented ${expectedIndent} level${
            expectedIndent === 1 ? '' : 's'
          }`,
        });

        score -= 15; // Penalty for each indentation error
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
      score: Math.max(0, score),
      confidence: 0.9,
    };
  }

  private async validateLenient(
    input: ValidationInput
  ): Promise<ValidationRuleResult> {
    const warnings: ValidationWarning[] = [];

    // Check indentation but only create warnings
    for (const userBlock of input.solution.blocks) {
      if (!userBlock.isInSolution) continue;

      const correctBlock = input.problem.correctSolution.find(
        (block) => block.id === userBlock.id
      );

      if (!correctBlock) continue;

      const expectedIndent = correctBlock.correctIndentation;
      const actualIndent = userBlock.indentationLevel;

      if (expectedIndent !== actualIndent) {
        warnings.push({
          type: 'style',
          blockId: userBlock.id,
          message: `Check indentation for "${userBlock.content}"`,
          suggestion: `Consider indenting this line ${expectedIndent} level${
            expectedIndent === 1 ? '' : 's'
          }`,
        });
      }
    }

    return {
      passed: true, // Always pass in lenient mode
      errors: [],
      warnings,
      score: 100, // Don't penalize score for indentation in lenient mode
      confidence: 0.7,
    };
  }
}
