import {
  ValidationRule,
  ValidationInput,
  ValidationRuleResult,
  ValidationError,
  ValidationErrorType,
} from '../types';

export class SyntaxValidationRule implements ValidationRule {
  name = 'syntax-validation';
  priority = 7;
  category = 'syntax' as const;

  async validate(input: ValidationInput): Promise<ValidationRuleResult> {
    // Skip syntax validation if not enabled in options
    if (!input.problem.options.validateSyntax) {
      return {
        passed: true,
        errors: [],
        warnings: [],
        score: 100,
        confidence: 0.5,
      };
    }

    const errors: ValidationError[] = [];
    let score = 100;

    try {
      // Get combined solution code
      const solution = input.solution.blocks
        .filter((block) => block.isInSolution)
        .sort((a, b) => a.position - b.position)
        .map((block) => {
          // Add indentation
          const indent = '  '.repeat(block.indentationLevel);
          return indent + block.content;
        })
        .join('\n');

      // For now, a basic syntax check based on language
      // In a real implementation, this would use language-specific parsers
      if (input.problem.metadata.language === 'python') {
        // Simple Python syntax checks as an example
        const syntaxErrors = this.checkPythonSyntax(solution);

        errors.push(...syntaxErrors);

        // Reduce score for syntax errors
        if (syntaxErrors.length > 0) {
          score = Math.max(50, 100 - syntaxErrors.length * 10);
        }
      }
    } catch (error) {
      errors.push({
        type: 'syntax_error' as ValidationErrorType,
        severity: 'major',
        expectedValue: 'Valid syntax',
        actualValue: 'Invalid syntax',
        message: `Syntax validation error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        suggestion: 'Check your code syntax carefully',
      });

      score = 70; // Penalize for general syntax issues
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
      score,
      confidence: 0.8,
    };
  }

  private checkPythonSyntax(code: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Very basic checks - a real implementation would use a Python parser
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for unclosed parentheses/brackets
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({
          type: 'syntax_error' as ValidationErrorType,
          severity: 'major',
          expectedValue: 'Balanced parentheses',
          actualValue: `Unbalanced parentheses (${openParens} open, ${closeParens} close)`,
          position: i,
          message: `Unbalanced parentheses on line ${i + 1}`,
          suggestion: 'Make sure all parentheses are properly closed',
        });
      }

      // Check for unclosed quotes
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        errors.push({
          type: 'syntax_error' as ValidationErrorType,
          severity: 'major',
          expectedValue: 'Balanced quotes',
          actualValue: 'Unbalanced single quotes',
          position: i,
          message: `Unbalanced single quotes on line ${i + 1}`,
          suggestion: 'Make sure all string quotes are properly closed',
        });
      }
      if (doubleQuotes % 2 !== 0) {
        errors.push({
          type: 'syntax_error' as ValidationErrorType,
          severity: 'major',
          expectedValue: 'Balanced quotes',
          actualValue: 'Unbalanced double quotes',
          position: i,
          message: `Unbalanced double quotes on line ${i + 1}`,
          suggestion: 'Make sure all string quotes are properly closed',
        });
      }
    }

    return errors;
  }
}
