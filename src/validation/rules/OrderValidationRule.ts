import {
  ValidationRule,
  ValidationInput,
  ValidationRuleResult,
  ValidationError,
  ValidationErrorType,
} from '../types';

export class OrderValidationRule implements ValidationRule {
  name = 'order-validation';
  priority = 10; // High priority
  category = 'order' as const;

  async validate(input: ValidationInput): Promise<ValidationRuleResult> {
    const errors: ValidationError[] = [];
    let score = 100;

    // Get correct order from problem
    const correctOrder = input.problem.correctSolution
      .sort((a, b) => a.correctPosition - b.correctPosition)
      .map((block) => block.id);

    // Get user's order (only blocks in solution)
    const userOrder = input.solution.blocks
      .filter((block) => block.isInSolution)
      .sort((a, b) => a.position - b.position)
      .map((block) => block.id);

    // Check for missing blocks
    const missingBlocks = correctOrder.filter(
      (blockId) => !userOrder.includes(blockId)
    );

    // Check for extra blocks (distractors in solution)
    const extraBlocks = userOrder.filter(
      (blockId) => !correctOrder.includes(blockId)
    );

    // Check for wrong order
    const orderErrors = this.findOrderErrors(correctOrder, userOrder);

    // Create errors for missing blocks
    missingBlocks.forEach((blockId) => {
      const block = input.problem.correctSolution.find((b) => b.id === blockId);
      errors.push({
        type: 'missing_block' as ValidationErrorType,
        severity: 'critical',
        blockId,
        expectedValue: `Block "${block?.content}" should be in your solution`,
        actualValue: 'Block not in solution',
        message: `Missing required code block: "${block?.content}"`,
        suggestion:
          'Look for this block in the available blocks and add it to your solution',
      });
    });

    // Create errors for extra blocks
    extraBlocks.forEach((blockId) => {
      const block = input.solution.blocks.find((b) => b.id === blockId);
      errors.push({
        type: 'extra_block' as ValidationErrorType,
        severity: 'major',
        blockId,
        expectedValue: 'Block should not be in solution',
        actualValue: `Block "${block?.content}" is in solution`,
        message: `This block should not be in your solution: "${block?.content}"`,
        suggestion: 'Remove this block from your solution',
      });
    });

    // Create errors for wrong order
    orderErrors.forEach((error) => {
      errors.push(error);
    });

    // Calculate score based on errors
    const totalErrors = errors.length;
    const criticalErrors = errors.filter(
      (e) => e.severity === 'critical'
    ).length;
    const majorErrors = errors.filter((e) => e.severity === 'major').length;

    if (criticalErrors > 0) {
      score = Math.max(0, 100 - criticalErrors * 30 - majorErrors * 15);
    } else if (majorErrors > 0) {
      score = Math.max(50, 100 - majorErrors * 20);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
      score,
      confidence: 0.95,
    };
  }

  private findOrderErrors(
    correctOrder: string[],
    userOrder: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Find longest common subsequence to identify out-of-order blocks
    const lcs = this.longestCommonSubsequence(correctOrder, userOrder);

    // Blocks not in LCS are potentially out of order
    const correctSet = new Set(correctOrder);
    const userSet = new Set(userOrder);
    const commonBlocks = correctOrder.filter((id) => userSet.has(id));

    for (let i = 0; i < commonBlocks.length; i++) {
      const blockId = commonBlocks[i];
      const correctPos = correctOrder.indexOf(blockId);
      const userPos = userOrder.indexOf(blockId);

      // Check if this block is significantly out of order
      const expectedRelativePos = correctPos / correctOrder.length;
      const actualRelativePos = userPos / userOrder.length;

      if (Math.abs(expectedRelativePos - actualRelativePos) > 0.2) {
        errors.push({
          type: 'wrong_order' as ValidationErrorType,
          severity: 'major',
          blockId,
          expectedValue: `Position around ${correctPos + 1}`,
          actualValue: `Position ${userPos + 1}`,
          position: userPos,
          message: `Block "${blockId}" appears to be in the wrong position`,
          suggestion: `This block should come ${
            correctPos < userPos ? 'earlier' : 'later'
          } in the sequence`,
        });
      }
    }

    return errors;
  }

  private longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
    const m = arr1.length;
    const n = arr2.length;
    const dp = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    // Build LCS table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Reconstruct LCS
    const lcs: string[] = [];
    let i = m,
      j = n;
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }
}
