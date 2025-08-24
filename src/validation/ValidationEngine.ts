import {
  ValidationInput,
  ValidationResult,
  ValidationRule,
  ValidationError,
  ValidationWarning,
  ValidationFeedback,
  ValidationMetadata,
  ValidationRuleResult,
  ValidationErrorType,
} from './types';
import { OrderValidationRule } from './rules/OrderValidationRule';
import { IndentationValidationRule } from './rules/IndentationValidationRule';
import { CompletenessValidationRule } from './rules/CompletenessValidationRule';
import { SyntaxValidationRule } from './rules/SyntaxValidationRule';
import { LogicValidationRule } from './rules/LogicValidationRule';
import { CombinedBlocksValidationRule } from './rules/CombinedBlocksValidationRule';

/**
 * Core validation engine that orchestrates all validation rules
 * This is the single source of truth for solution validation
 */
export class ValidationEngine {
  private rules: ValidationRule[];
  private version = '1.0.0';

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Main validation method - validates a solution against a problem
   */
  async validate(input: ValidationInput): Promise<ValidationResult> {
    const startTime = Date.now();

    console.log(`🔍 Starting validation for problem ${input.problem.id}`);

    // Normalize and prepare input
    const normalizedInput = this.normalizeInput(input);

    // Apply all validation rules
    const ruleResults = await this.applyRules(normalizedInput);

    // Aggregate results
    const aggregatedResult = this.aggregateResults(ruleResults);

    // Generate feedback
    const feedback = this.generateFeedback(aggregatedResult);

    // Create metadata
    const metadata = this.createMetadata(startTime, ruleResults);

    const result: ValidationResult = {
      isCorrect: aggregatedResult.isCorrect,
      score: aggregatedResult.score,
      errors: aggregatedResult.errors,
      warnings: aggregatedResult.warnings,
      feedback,
      metadata,
    };

    console.log(
      `✅ Validation completed: ${
        result.isCorrect ? 'CORRECT' : 'INCORRECT'
      } (Score: ${result.score})`
    );

    return result;
  }

  /**
   * Quick validation for real-time feedback (subset of rules)
   */
  async quickValidate(
    input: ValidationInput
  ): Promise<Partial<ValidationResult>> {
    const quickRules = this.rules.filter((rule) =>
      ['order', 'completeness'].includes(rule.category)
    );

    const ruleResults = await Promise.all(
      quickRules.map((rule) => rule.validate(input))
    );

    const hasErrors = ruleResults.some((result) => !result.passed);
    const totalScore =
      ruleResults.reduce((sum, result) => sum + result.score, 0) /
      ruleResults.length;

    return {
      isCorrect: !hasErrors && totalScore >= 80,
      score: totalScore,
      errors: ruleResults.flatMap((result) => result.errors),
    };
  }

  /**
   * Validate specific aspect (e.g., only indentation)
   */
  async validateAspect(
    input: ValidationInput,
    category: 'order' | 'indentation' | 'completeness' | 'syntax' | 'logic'
  ): Promise<ValidationResult> {
    const relevantRules = this.rules.filter(
      (rule) => rule.category === category
    );

    const ruleResults = await Promise.all(
      relevantRules.map((rule) => rule.validate(input))
    );

    // Aggregate results
    const aggregatedResult = this.aggregateResults(ruleResults);

    // Generate feedback
    const feedback = this.generateFeedback(aggregatedResult);

    // Create metadata
    const metadata = this.createMetadata(Date.now(), ruleResults);

    return {
      ...aggregatedResult,
      feedback,
      metadata,
    };
  }

  private initializeRules(): ValidationRule[] {
    return [
      new OrderValidationRule(),
      new IndentationValidationRule(),
      new CompletenessValidationRule(),
      new SyntaxValidationRule(),
      new LogicValidationRule(),
      new CombinedBlocksValidationRule(),
    ].sort((a, b) => b.priority - a.priority); // Sort by priority (high to low)
  }

  private normalizeInput(input: ValidationInput): ValidationInput {
    // Normalize whitespace, case, etc. based on problem options
    const normalizedSolution = {
      ...input.solution,
      blocks: input.solution.blocks.map((block) => {
        // First apply case sensitivity transformation
        let normalizedContent = input.problem.options.caseSensitive
          ? block.content
          : block.content.toLowerCase();

        // Then apply whitespace transformation
        normalizedContent = input.problem.options.allowExtraSpaces
          ? normalizedContent.trim()
          : normalizedContent;

        return {
          ...block,
          content: normalizedContent,
        };
      }),
    };

    return {
      ...input,
      solution: normalizedSolution,
    };
  }

  private async applyRules(
    input: ValidationInput
  ): Promise<ValidationRuleResult[]> {
    const results = await Promise.all(
      this.rules.map(async (rule) => {
        try {
          const result = await rule.validate(input);
          console.log(
            `📏 Rule ${rule.name}: ${result.passed ? 'PASS' : 'FAIL'} (Score: ${
              result.score
            })`
          );
          return result;
        } catch (error) {
          console.error(`❌ Error in rule ${rule.name}:`, error);
          return {
            passed: false,
            errors: [
              {
                type: 'logic_error' as ValidationErrorType,
                severity: 'critical',
                message: `Validation rule error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                expectedValue: null,
                actualValue: null,
              },
            ],
            warnings: [],
            score: 0,
            confidence: 0,
          };
        }
      })
    );

    return results as ValidationRuleResult[];
  }

  private aggregateResults(ruleResults: ValidationRuleResult[]): {
    isCorrect: boolean;
    score: number;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const allErrors = ruleResults.flatMap((result) => result.errors);
    const allWarnings = ruleResults.flatMap((result) => result.warnings);

    // Calculate weighted score
    const totalWeight = this.rules.reduce(
      (sum, rule) => sum + rule.priority,
      0
    );
    const weightedScore =
      ruleResults.reduce((sum, result, index) => {
        const rule = this.rules[index];
        return sum + result.score * rule.priority;
      }, 0) / totalWeight;

    // Determine correctness
    const criticalErrors = allErrors.filter(
      (error) => error.severity === 'critical'
    );
    const majorErrors = allErrors.filter((error) => error.severity === 'major');

    const isCorrect =
      criticalErrors.length === 0 &&
      majorErrors.length === 0 &&
      weightedScore >= 80;

    return {
      isCorrect,
      score: Math.round(weightedScore),
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  private generateFeedback(result: {
    isCorrect: boolean;
    score: number;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }): ValidationFeedback {
    if (result.isCorrect) {
      return {
        type: 'success',
        summary: 'Excellent work! Your solution is correct.',
        details: [],
        nextSteps: ['Try a more challenging problem', 'Help others learn'],
        encouragement: "You've mastered this concept!",
      };
    }

    // Group errors by category for organized feedback
    const errorsByCategory = result.errors.reduce((groups, error) => {
      const category = this.getErrorCategory(error.type);
      if (!groups[category]) groups[category] = [];
      groups[category].push(error);
      return groups;
    }, {} as Record<string, ValidationError[]>);

    const details = Object.entries(errorsByCategory).map(
      ([category, errors]) => ({
        category: category as 'order' | 'indentation' | 'logic' | 'syntax',
        message: this.getCategoryMessage(category, errors),
        helpLevel: 'explanation' as const,
      })
    );

    const nextSteps = this.generateNextSteps(result.errors);

    return {
      type: result.score > 50 ? 'partial' : 'incorrect',
      summary: this.generateSummary(result.score),
      details,
      nextSteps,
      encouragement: this.generateEncouragement(result.score),
    };
  }

  private createMetadata(
    startTime: number,
    ruleResults: ValidationRuleResult[]
  ): ValidationMetadata {
    return {
      validatedAt: new Date().toISOString(),
      validationDuration: Date.now() - startTime,
      rulesApplied: this.rules.map((rule) => rule.name),
      confidence:
        ruleResults.reduce((sum, result) => sum + result.confidence, 0) /
        ruleResults.length,
      version: this.version,
    };
  }

  private getErrorCategory(errorType: string): string {
    const categoryMap: Record<string, string> = {
      wrong_order: 'order',
      wrong_indentation: 'indentation',
      missing_block: 'order',
      extra_block: 'order',
      syntax_error: 'syntax',
      logic_error: 'logic',
      incomplete_solution: 'order',
    };
    return categoryMap[errorType] || 'logic';
  }

  private getCategoryMessage(
    category: string,
    errors: ValidationError[]
  ): string {
    const messageMap: Record<string, string> = {
      order: `There ${errors.length === 1 ? 'is' : 'are'} ${
        errors.length
      } issue${
        errors.length === 1 ? '' : 's'
      } with the order of your code blocks.`,
      indentation: `Check the indentation of your code blocks. Python uses indentation to show code structure.`,
      syntax: `There ${
        errors.length === 1 ? 'is a syntax error' : 'are syntax errors'
      } in your solution.`,
      logic: `The logic of your solution needs attention.`,
    };
    return messageMap[category] || 'There are issues with your solution.';
  }

  private generateNextSteps(errors: ValidationError[]): string[] {
    const steps: string[] = [];

    if (errors.some((e) => e.type === 'wrong_order')) {
      steps.push('Review the logical flow of the program');
      steps.push('Think about what should happen first, second, third...');
    }

    if (errors.some((e) => e.type === 'wrong_indentation')) {
      steps.push('Check which lines should be indented');
      steps.push(
        'Remember: code inside loops and if statements should be indented'
      );
    }

    if (errors.some((e) => e.type === 'missing_block')) {
      steps.push('Look for unused code blocks that might be needed');
    }

    if (steps.length === 0) {
      steps.push('Read through your code step by step');
      steps.push('Ask yourself: does this solve the problem?');
    }

    return steps;
  }

  private generateSummary(score: number): string {
    if (score >= 80) {
      return "You're very close! Just a few small adjustments needed.";
    } else if (score >= 50) {
      return "You're on the right track. Let's fix these issues step by step.";
    } else {
      return "Let's work through this together. Focus on one issue at a time.";
    }
  }

  private generateEncouragement(score: number): string {
    if (score >= 70) {
      return "Great progress! You're almost there.";
    } else if (score >= 40) {
      return "Keep going! You're learning and improving.";
    } else {
      return 'Every mistake is a learning opportunity. You can do this!';
    }
  }
}

// Export singleton instance
export const validationEngine = new ValidationEngine();
