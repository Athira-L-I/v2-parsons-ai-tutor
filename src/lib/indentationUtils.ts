/**
 * Shared utility functions for indentation validation used by both
 * the ValidationEngine and the real-time indentation hints.
 */
import { SolutionBlock } from "../validation/types";

export interface IndentationIssue {
  blockId: string;
  expectedDiff: number;
  actualDiff: number;
  prevBlockId: string;
  message: string;
  lineIndex?: number;
}

/**
 * Validates indentation relationships between blocks in the same group.
 * Used by both ValidationEngine and real-time indentation hints.
 */
export function validateGroupIndentationRelationships(
  groupedBlocks: Map<string, any[]>,
  getIndentLevel: (block: any) => number,
  getBlockId: (block: any) => string,
  includeLineIndices = false
): IndentationIssue[] {
  const issues: IndentationIssue[] = [];

  // Check relative indentation within each group
  groupedBlocks.forEach((blocks) => {
    // Skip if only one block in the group
    if (blocks.length <= 1) return;

    // Check relative indentation between consecutive blocks
    for (let i = 1; i < blocks.length; i++) {
      const prevBlock = blocks[i - 1];
      const currentBlock = blocks[i];

      // Calculate the expected indentation difference between these blocks
      const expectedDiff = getIndentLevel(currentBlock) - getIndentLevel(prevBlock);
      const actualDiff = getIndentLevel(currentBlock) - getIndentLevel(prevBlock);

      if (expectedDiff !== actualDiff) {
        issues.push({
          blockId: getBlockId(currentBlock),
          prevBlockId: getBlockId(prevBlock),
          expectedDiff,
          actualDiff,
          message: `Incorrect indentation within combined block. This line should ${
            expectedDiff > actualDiff ? 'be indented more' : 'be indented less'
          } relative to the previous line.`,
          // Only include lineIndex if requested
          ...(includeLineIndices && 'lineIndex' in currentBlock 
              ? { lineIndex: currentBlock.lineIndex } 
              : {})
        });
      }
    }
  });

  return issues;
}

/**
 * Gets the indentation level of a line (number of leading spaces / 4)
 */
export function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  return Math.floor(match[1].length / 4);
}

/**
 * Expands solution arrays to handle combined blocks (marked with \n or actual newlines)
 */
export function expandCombinedBlocks(solution: string[]): string[] {
  const expanded: string[] = [];

  solution.forEach((line) => {
    if (line.includes('\n')) {
      // This is a combined block - split it into individual lines
      const subLines = line.split('\n');
      expanded.push(...subLines);
    } else {
      // Regular single line
      expanded.push(line);
    }
  });

  return expanded;
}

/**
 * Checks if a line is a control structure
 */
export function isControlStructure(line: string): boolean {
  const trimmed = line.trim();
  return /^(if|for|while|def|class|try|except|finally|with|elif|else)[\s:]/.test(
    trimmed
  );
}
