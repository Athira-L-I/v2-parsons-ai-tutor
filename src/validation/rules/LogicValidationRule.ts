import {
  ValidationRule,
  ValidationInput,
  ValidationRuleResult,
  ValidationError,
  ValidationErrorType,
} from '../types';

export class LogicValidationRule implements ValidationRule {
  name = 'logic-validation';
  priority = 6;
  category = 'logic' as const;

  async validate(input: ValidationInput): Promise<ValidationRuleResult> {
    // Logic validation is more complex and often requires language-specific analysis
    // or even execution of code. This is a simplified version.

    const errors: ValidationError[] = [];
    let score = 100;

    // Check for dependency violations
    const dependencyErrors = this.checkDependencies(input);
    errors.push(...dependencyErrors);

    // Check for logical blocks in wrong positions affecting program flow
    const flowErrors = this.checkProgramFlow(input);
    errors.push(...flowErrors);

    // Calculate score based on errors
    if (errors.length > 0) {
      const criticalErrors = errors.filter(
        (e) => e.severity === 'critical'
      ).length;
      const majorErrors = errors.filter((e) => e.severity === 'major').length;
      score = Math.max(50, 100 - criticalErrors * 25 - majorErrors * 15);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
      score,
      confidence: 0.7, // Lower confidence for logic validation
    };
  }

  private checkDependencies(input: ValidationInput): ValidationError[] {
    const errors: ValidationError[] = [];

    // Get blocks used in solution
    const userBlockIds = new Set(
      input.solution.blocks
        .filter((block) => block.isInSolution)
        .map((block) => block.id)
    );

    // Check if all dependencies are satisfied for each block in solution
    for (const userBlock of input.solution.blocks) {
      if (!userBlock.isInSolution) continue;

      const correctBlock = input.problem.correctSolution.find(
        (block) => block.id === userBlock.id
      );

      if (!correctBlock) continue;

      // Check if all required dependencies are present in the solution
      for (const depId of correctBlock.dependencies) {
        if (!userBlockIds.has(depId)) {
          errors.push({
            type: 'logic_error' as ValidationErrorType,
            severity: 'major',
            blockId: userBlock.id,
            expectedValue: `Block depends on "${depId}"`,
            actualValue: `Dependency "${depId}" not in solution`,
            message: `Block "${userBlock.content}" depends on another block that's not in your solution`,
            suggestion:
              'Check if you are missing code that this block depends on',
          });
        }
      }
    }

    return errors;
  }

  private checkProgramFlow(input: ValidationInput): ValidationError[] {
    const errors: ValidationError[] = [];
    const language = input.problem.metadata.language;

    // For Python, check if blocks like 'else:' come after 'if:'
    if (language === 'python') {
      const userBlocks = input.solution.blocks
        .filter((block) => block.isInSolution)
        .sort((a, b) => a.position - b.position);

      for (let i = 0; i < userBlocks.length; i++) {
        const block = userBlocks[i];

        // Check for 'else:' without preceding 'if:'
        if (block.content.trim().startsWith('else:')) {
          let hasMatchingIf = false;

          // Look for an 'if:' block before this 'else:'
          for (let j = 0; j < i; j++) {
            if (
              userBlocks[j].content.trim().includes('if ') &&
              userBlocks[j].content.trim().endsWith(':')
            ) {
              hasMatchingIf = true;
              break;
            }
          }

          if (!hasMatchingIf) {
            errors.push({
              type: 'logic_error' as ValidationErrorType,
              severity: 'major',
              blockId: block.id,
              expectedValue: 'else: should follow an if: block',
              actualValue: 'else: without a preceding if: block',
              position: block.position,
              message:
                'This "else:" statement does not have a matching "if:" statement before it',
              suggestion:
                'Make sure you have an "if:" statement before using "else:"',
            });
          }
        }

        // Similar checks could be done for 'elif:', 'except:', etc.
      }
    }

    return errors;
  }
}
