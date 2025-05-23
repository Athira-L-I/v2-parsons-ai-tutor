// src/lib/adaptiveFeatures.ts - Complete implementation
import { ParsonsSettings } from '@/@types/types';

export interface AdaptiveState {
  attempts: number;
  incorrectAttempts: number;
  combinedBlocks: number;
  removedDistractors: number;
  // indentationProvided: boolean;
}

export interface BlockCombineResult {
  success: boolean;
  newSettings: ParsonsSettings;
  combinedBlocks: number;
  message: string;
}

export interface PairedDistractorResult {
  success: boolean;
  newSettings: ParsonsSettings;
  pairedGroups: PairedDistractor[][];
  message: string;
}

export interface IndentationResult {
  success: boolean;
  newSettings: ParsonsSettings;
  // : boolean;
  message: string;
}

export interface DistractorRemovalResult {
  success: boolean;
  newSettings: ParsonsSettings;
  removedDistractors: number;
  message: string;
}

export interface PairedDistractor {
  id: string;
  correct: string;
  distractor: string;
  group: number;
}

export interface IndentationHint {
  lineIndex: number;
  currentIndent: number;
  expectedIndent: number;
  hint: string;
}

/**
 * Combines adjacent blocks in a Parsons problem to make it easier
 */
export function combineBlocks(
  settings: ParsonsSettings,
  targetCombinations: number = 1
): BlockCombineResult {
  const lines = settings.initial.split('\n').filter((line) => line.trim());

  // Separate solution lines from distractors
  const solutionLines: string[] = [];
  const distractorLines: string[] = [];

  lines.forEach((line) => {
    if (line.includes('#distractor')) {
      distractorLines.push(line);
    } else {
      solutionLines.push(line);
    }
  });

  if (solutionLines.length <= 3) {
    return {
      success: false,
      newSettings: settings,
      combinedBlocks: 0,
      message: 'Cannot combine blocks - too few solution blocks remaining',
    };
  }

  // Find the best blocks to combine based on indentation and logic flow
  const combinedLines = [...solutionLines];
  let combinationsPerformed = 0;

  for (let i = 0; i < targetCombinations && combinedLines.length > 3; i++) {
    const bestCombineIndex = findBestCombineIndex(combinedLines);

    if (
      bestCombineIndex !== -1 &&
      bestCombineIndex < combinedLines.length - 1
    ) {
      // Combine the block at bestCombineIndex with the next block using \\n
      // This is the Parsons widget standard for multi-line blocks
      const combinedLine =
        combinedLines[bestCombineIndex] +
        '\\n' +
        combinedLines[bestCombineIndex + 1];
      combinedLines.splice(bestCombineIndex, 2, combinedLine);
      combinationsPerformed++;
    } else {
      break; // No more good combinations available
    }
  }

  // Reconstruct the initial code with combined blocks and distractors
  const newInitial = [...combinedLines, ...distractorLines].join('\n');

  const newSettings: ParsonsSettings = {
    ...settings,
    initial: newInitial,
    options: {
      ...settings.options,
      max_wrong_lines: Math.max(
        0,
        (settings.options.max_wrong_lines || 10) - 1
      ),
    },
  };

  return {
    success: combinationsPerformed > 0,
    newSettings,
    combinedBlocks: combinationsPerformed,
    message: `Combined ${combinationsPerformed} block(s) to simplify the problem`,
  };
}

/**
 * Finds the best index to combine blocks based on indentation and logical flow
 */
function findBestCombineIndex(lines: string[]): number {
  let bestIndex = -1;
  let bestScore = -1;

  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    const currentIndent = getIndentLevel(currentLine);
    const nextIndent = getIndentLevel(nextLine);

    let score = 0;

    // Prefer combining blocks with the same indentation
    if (currentIndent === nextIndent) {
      score += 3;
    }

    // Prefer combining blocks where the second block is more indented (nested)
    if (nextIndent > currentIndent) {
      score += 2;
    }

    // Prefer combining shorter blocks
    const totalLength = currentLine.length + nextLine.length;
    if (totalLength < 100) {
      score += 1;
    }

    // Avoid combining control structures with their bodies unless necessary
    if (isControlStructure(currentLine) && nextIndent > currentIndent) {
      score -= 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Gets the indentation level of a line (number of leading spaces / 4)
 */
function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  return Math.floor(match[1].length / 4);
}

/**
 * Checks if a line is a control structure
 */
function isControlStructure(line: string): boolean {
  const trimmed = line.trim();
  return /^(if|for|while|def|class|try|except|finally|with|elif|else)[\s:]/.test(
    trimmed
  );
}

/**
 * Removes distractor blocks to make the problem easier
 */
export function removeDistractors(
  settings: ParsonsSettings,
  maxToRemove: number = 2
): BlockCombineResult {
  const lines = settings.initial.split('\n').filter((line) => line.trim());

  const distractorLines = lines.filter((line) => line.includes('#distractor'));
  const solutionLines = lines.filter((line) => !line.includes('#distractor'));

  if (distractorLines.length === 0) {
    return {
      success: false,
      newSettings: settings,
      combinedBlocks: 0,
      message: 'No distractors available to remove',
    };
  }

  const numToRemove = Math.min(maxToRemove, distractorLines.length);
  const remainingDistractors = distractorLines.slice(numToRemove);

  const newInitial = [...solutionLines, ...remainingDistractors].join('\n');

  const newSettings: ParsonsSettings = {
    ...settings,
    initial: newInitial,
    options: {
      ...settings.options,
      max_wrong_lines: Math.max(0, remainingDistractors.length),
    },
  };

  return {
    success: true,
    newSettings,
    combinedBlocks: numToRemove,
    message: `Removed ${numToRemove} distractor block(s) to simplify the problem`,
  };
}

/**
 * Enhanced paired distractor identification with better visual grouping
 */
export function identifyPairedDistractorsEnhanced(
  settings: ParsonsSettings
): PairedDistractorResult & { shuffleResult: ShuffleResult } {
  const result = identifyPairedDistractors(settings);

  if (result.success) {
    const shuffleResult = shuffleWithPairedGroups(
      result.newSettings,
      result.pairedGroups
    );

    const enhancedSettings: ParsonsSettings = {
      ...result.newSettings,
      initial: shuffleResult.shuffledLines.join('\n'),
    };

    return {
      ...result,
      newSettings: enhancedSettings,
      shuffleResult,
    };
  }

  return {
    ...result,
    shuffleResult: { shuffledLines: [], groupInfo: [] },
  };
}

/**
 * Identifies and groups paired distractors in a Parsons problem
 */
export function identifyPairedDistractors(
  settings: ParsonsSettings
): PairedDistractorResult {
  const lines = settings.initial.split('\n').filter((line) => line.trim());

  const solutionLines = lines.filter((line) => !line.includes('#distractor'));
  const distractorLines = lines.filter((line) => line.includes('#distractor'));

  const pairs: PairedDistractor[] = [];
  const groups: PairedDistractor[][] = [];
  let groupId = 0;

  // Find distractors that are similar to solution lines (paired distractors)
  solutionLines.forEach((solutionLine, solutionIndex) => {
    const cleanSolution = solutionLine.trim();
    const matchingDistractors: PairedDistractor[] = [];

    distractorLines.forEach((distractorLine, distractorIndex) => {
      const cleanDistractor = distractorLine.replace('#distractor', '').trim();

      // Check if distractor is similar to solution line
      if (areLinesRelated(cleanSolution, cleanDistractor)) {
        const pair: PairedDistractor = {
          id: `pair-${solutionIndex}-${distractorIndex}`,
          correct: cleanSolution,
          distractor: cleanDistractor,
          group: groupId,
        };
        pairs.push(pair);
        matchingDistractors.push(pair);
      }
    });

    if (matchingDistractors.length > 0) {
      // Add the solution line as the "correct" option in the group
      const correctOption: PairedDistractor = {
        id: `correct-${solutionIndex}`,
        correct: cleanSolution,
        distractor: '', // Empty for correct option
        group: groupId,
      };

      groups.push([correctOption, ...matchingDistractors]);
      groupId++;
    }
  });

  // Update settings to mark paired distractors
  const updatedLines = lines.map((line) => {
    if (line.includes('#distractor')) {
      const cleanLine = line.replace('#distractor', '').trim();
      const isPaired = pairs.some((pair) => pair.distractor === cleanLine);
      if (isPaired) {
        return line.replace('#distractor', '#paired');
      }
    }
    return line;
  });

  const newSettings: ParsonsSettings = {
    ...settings,
    initial: updatedLines.join('\n'),
  };

  return {
    success: groups.length > 0,
    newSettings,
    pairedGroups: groups,
    message: `Found ${groups.length} paired distractor group(s)`,
  };
}

/**
 * Checks if two lines of code are related (for paired distractors)
 */
function areLinesRelated(line1: string, line2: string): boolean {
  // Remove common variations and compare
  const normalize = (line: string) =>
    line.toLowerCase().replace(/\s+/g, ' ').replace(/['"]/g, '').trim();

  const norm1 = normalize(line1);
  const norm2 = normalize(line2);

  // Check for common distractor patterns
  const patterns = [
    // Variable name changes
    () => {
      const words1 = norm1.split(' ');
      const words2 = norm2.split(' ');
      if (words1.length === words2.length) {
        let differences = 0;
        for (let i = 0; i < words1.length; i++) {
          if (words1[i] !== words2[i]) differences++;
        }
        return differences === 1; // Only one word different
      }
      return false;
    },

    // Operator changes
    () => {
      const operators = [
        '==',
        '!=',
        '>',
        '<',
        '>=',
        '<=',
        '+',
        '-',
        '*',
        '/',
        'and',
        'or',
      ];
      return operators.some(
        (op) =>
          norm1.includes(op) &&
          operators.some(
            (otherOp) =>
              otherOp !== op &&
              norm2.includes(otherOp) &&
              norm1.replace(op, otherOp) === norm2
          )
      );
    },

    // Similar structure with small changes
    () => {
      const similarity = calculateSimilarity(norm1, norm2);
      return similarity > 0.7 && similarity < 1.0;
    },
  ];

  return patterns.some((pattern) => pattern());
}

/**
 * Calculates similarity between two strings (0 = completely different, 1 = identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = calculateEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculates edit distance between two strings
 */
function calculateEditDistance(str1: string, str2: string): number {
  const matrix = Array(str1.length + 1)
    .fill(null)
    .map(() => Array(str2.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[str1.length][str2.length];
}

/**
 * Provides indentation for a Parsons problem to make it easier
 */
// Find this function (around line 250-270) and replace it:
export function provideIndentation(
  settings: ParsonsSettings
): IndentationResult {
  const newSettings: ParsonsSettings = {
    ...settings,
    options: {
      ...settings.options,
      can_indent: false, // Disable indentation controls - this IS the "provided" state
      x_indent: 0, // No indentation control needed
    },
  };

  return {
    success: true,
    newSettings,
    // : true,
    message:
      'Indentation controls have been disabled - correct indentation is provided',
  };
}

/**
 * Generates indentation hints for student guidance
 */
export function generateIndentationHints(
  studentSolution: string[],
  correctSolution: string[]
): IndentationHint[] {
  const hints: IndentationHint[] = [];

  const maxLength = Math.min(studentSolution.length, correctSolution.length);
  for (let i = 0; i < maxLength; i++) {
    const studentLine = studentSolution[i];
    const correctLine = correctSolution[i];
    const studentIndent = getIndentLevel(studentLine);
    const correctIndent = getIndentLevel(correctLine);

    if (studentIndent !== correctIndent) {
      let hint = '';

      if (studentIndent < correctIndent) {
        hint = `Line ${
          i + 1
        } should be indented more. It should be inside a code block.`;
      } else {
        hint = `Line ${
          i + 1
        } should be indented less. It should be at a higher level.`;
      }

      // Add context-specific hints
      const trimmedLine = studentLine.trim();
      if (
        trimmedLine.startsWith('if ') ||
        trimmedLine.startsWith('for ') ||
        trimmedLine.startsWith('while ')
      ) {
        hint += ' Control structures define new code blocks.';
      } else if (
        trimmedLine.startsWith('else:') ||
        trimmedLine.startsWith('elif ')
      ) {
        hint += ' This should align with the matching if statement.';
      } else if (trimmedLine.startsWith('return ')) {
        hint += ' Return statements are usually inside functions.';
      }

      hints.push({
        lineIndex: i,
        currentIndent: studentIndent,
        expectedIndent: correctIndent,
        hint,
      });
    }
  }
  return hints;
}

/**
 * Checks if indentation can be disabled (all lines have correct indentation)
 */
export function canDisableIndentation(
  studentSolution: string[],
  correctSolution: string[]
): boolean {
  const hints = generateIndentationHints(studentSolution, correctSolution);
  return hints.length === 0;
}

/**
 * Validates indentation rules for Python-like syntax
 */
export function validatePythonIndentation(lines: string[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let expectedIndent = 0;
  const indentStack: number[] = [0];

  lines.forEach((line, index) => {
    if (!line.trim()) return; // Skip empty lines
    const currentIndent = getIndentLevel(line);
    const trimmedLine = line.trim();

    // Check for lines that should increase indentation
    if (trimmedLine.endsWith(':')) {
      expectedIndent = currentIndent + 1;
      indentStack.push(currentIndent);
    }
    // Check for lines that should decrease indentation
    else if (
      trimmedLine.startsWith('else:') ||
      trimmedLine.startsWith('elif ') ||
      trimmedLine.startsWith('except:') ||
      trimmedLine.startsWith('finally:')
    ) {
      const matchingIndent = indentStack[indentStack.length - 1];
      if (currentIndent !== matchingIndent) {
        errors.push(
          `Line ${
            index + 1
          }: ${trimmedLine} should align with its matching block`
        );
      }
    }
    // Regular lines should match expected indentation
    else {
      // Handle dedenting
      while (
        indentStack.length > 1 &&
        currentIndent < indentStack[indentStack.length - 1]
      ) {
        indentStack.pop();
      }

      if (currentIndent > indentStack[indentStack.length - 1] + 1) {
        errors.push(`Line ${index + 1}: Unexpected indentation level`);
      }
    }
  });
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface ShuffleResult {
  shuffledLines: string[];
  groupInfo: GroupInfo[];
}

export interface GroupInfo {
  groupId: number;
  startIndex: number;
  endIndex: number;
  color: string;
}

/**
 * Shuffles lines while keeping paired distractors grouped together
 */
export function shuffleWithPairedGroups(
  settings: ParsonsSettings,
  pairedGroups: PairedDistractor[][]
): ShuffleResult {
  const lines = settings.initial.split('\n').filter((line) => line.trim());

  // Separate into groups and standalone lines
  const groupedLines: string[][] = [];
  const standaloneLines: string[] = [];
  const groupInfo: GroupInfo[] = [];

  const groupColors = [
    'border-purple-200 bg-purple-50',
    'border-indigo-200 bg-indigo-50',
    'border-pink-200 bg-pink-50',
    'border-teal-200 bg-teal-50',
    'border-amber-200 bg-amber-50',
  ];

  // Process paired groups
  pairedGroups.forEach((group, groupIndex) => {
    const groupLines: string[] = [];

    group.forEach((item) => {
      const lineToFind =
        item.distractor === '' ? item.correct : item.distractor;
      const fullLine = lines.find((line) => {
        const cleanLine = line
          .replace('#distractor', '')
          .replace('#paired', '')
          .trim();
        return cleanLine === lineToFind;
      });

      if (fullLine) {
        groupLines.push(fullLine);
      }
    });

    if (groupLines.length > 0) {
      // Shuffle within the group
      const shuffledGroup = shuffleArray([...groupLines]);
      groupedLines.push(shuffledGroup);

      groupInfo.push({
        groupId: groupIndex,
        startIndex: -1, // Will be set later
        endIndex: -1, // Will be set later
        color: groupColors[groupIndex % groupColors.length],
      });
    }
  });

  // Find standalone lines (not in any paired group)
  const usedLines = new Set();
  groupedLines.forEach((group) => {
    group.forEach((line) => usedLines.add(line));
  });

  lines.forEach((line) => {
    if (!usedLines.has(line)) {
      standaloneLines.push(line);
    }
  });

  // Shuffle standalone lines
  const shuffledStandalone = shuffleArray([...standaloneLines]);

  // Combine groups and standalone lines randomly
  const allBlocks: (string[] | string)[] = [
    ...groupedLines,
    ...shuffledStandalone.map((line) => [line]), // Wrap standalone lines as single-item arrays
  ];

  const shuffledBlocks = shuffleArray(allBlocks);

  // Flatten and update group info with actual indices
  const finalLines: string[] = [];
  let currentIndex = 0;

  shuffledBlocks.forEach((block) => {
    if (Array.isArray(block)) {
      // Find if this block is a paired group
      const groupIndex = groupedLines.findIndex(
        (group) =>
          group.length === block.length &&
          group.every((line, i) => line === block[i])
      );

      if (groupIndex !== -1) {
        groupInfo[groupIndex].startIndex = currentIndex;
        groupInfo[groupIndex].endIndex = currentIndex + block.length - 1;
      }

      finalLines.push(...block);
      currentIndex += block.length;
    }
  });

  return {
    shuffledLines: finalLines,
    groupInfo: groupInfo.filter((info) => info.startIndex !== -1),
  };
}

/**
 * Utility function to shuffle an array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Checks if indentation has been provided (controls disabled)
 */
export function isIndentationProvided(settings: ParsonsSettings): boolean {
  return settings.options.can_indent === false;
}
