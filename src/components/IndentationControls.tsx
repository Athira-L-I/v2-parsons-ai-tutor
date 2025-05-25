import React from 'react';
import { ParsonsSettings } from '@/@types/types';
import IndentationHelper from './IndentationHelper';
import {
  generateIndentationHints,
  IndentationHint,
} from '@/lib/adaptiveFeatures';

interface BlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
  originalIndex: number;
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isCombined?: boolean;
  subLines?: string[];
}

interface IndentationControlsProps {
  settings: ParsonsSettings;
  currentSolution: BlockItem[];
  onChangeIndentation: (blockId: string, newIndent: number) => void;
  onApplyHint: (blockId: string, lineIndex: number) => void;
  className?: string;
}

const IndentationControls: React.FC<IndentationControlsProps> = ({
  settings,
  currentSolution,
  onChangeIndentation,
  onApplyHint,
  className = '',
}) => {
  const isProvided = settings.options.can_indent === false;

  // Generate current solution lines for hint calculation
  const getCurrentSolutionLines = (): string[] => {
    const lines: string[] = [];
    currentSolution.forEach((block) => {
      const blockIndent = '    '.repeat(block.indentation);
      if (block.isCombined && block.subLines) {
        block.subLines.forEach((subLine) => {
          // For combined blocks, apply the block's indentation to each subLine
          // If the subLine already has indentation, preserve the relative structure
          const trimmedSubLine = subLine.trim();
          const subLineIndent = subLine.match(/^(\s*)/)?.[1] || '';
          const additionalIndent = Math.floor(subLineIndent.length / 4);
          const totalIndent = '    '.repeat(
            block.indentation + additionalIndent
          );
          lines.push(`${totalIndent}${trimmedSubLine}`);
        });
      } else {
        lines.push(`${blockIndent}${block.text}`);
      }
    });
    return lines;
  };

  // Generate expected solution lines from settings
  const getExpectedSolutionLines = (): string[] => {
    const correctCodeLines = settings.initial
      .split('\n')
      .filter((line) => line.trim() && !line.includes('#distractor'));

    const expectedLines: string[] = [];
    currentSolution.forEach((block) => {
      if (block.isCombined && block.subLines) {
        block.subLines.forEach((subLine) => {
          const cleanSubLine = subLine.trim();
          const matchingCorrectLine = correctCodeLines.find(
            (correctLine) => correctLine.trim() === cleanSubLine
          );
          if (matchingCorrectLine) {
            expectedLines.push(matchingCorrectLine);
          } else {
            expectedLines.push(subLine);
          }
        });
      } else {
        const cleanBlockText = block.text.trim();
        const matchingCorrectLine = correctCodeLines.find(
          (correctLine) => correctLine.trim() === cleanBlockText
        );
        if (matchingCorrectLine) {
          expectedLines.push(matchingCorrectLine);
        } else {
          expectedLines.push(block.text);
        }
      }
    });
    return expectedLines;
  };

  const hints = generateIndentationHints(
    getCurrentSolutionLines(),
    getExpectedSolutionLines()
  );

  if (isProvided) {
    return (
      <IndentationHelper
        hints={hints}
        onApplyHint={(lineIndex: number) => {
          // Find which block corresponds to this line index
          let currentLineIndex = 0;
          let targetBlockId = '';
          let expectedIndent = 0;

          // Find the hint for this line to get expected indentation
          const relevantHint = hints.find(
            (hint) => hint.lineIndex === lineIndex
          );
          if (relevantHint) {
            expectedIndent = relevantHint.expectedIndent;
          }

          for (const block of currentSolution) {
            let blockLineCount = 1;
            if (block.isCombined && block.subLines) {
              blockLineCount = block.subLines.length;
            }

            if (
              lineIndex >= currentLineIndex &&
              lineIndex < currentLineIndex + blockLineCount
            ) {
              targetBlockId = block.id;
              break;
            }
            currentLineIndex += blockLineCount;
          }

          if (targetBlockId) {
            // Use the onChangeIndentation callback instead of onApplyHint
            // This will directly update the indentation
            onChangeIndentation(targetBlockId, expectedIndent);
          }
        }}
        className={className}
      />
    );
  }

  const handleIndentDecrease = (blockId: string, currentIndent: number) => {
    if (currentIndent > 0) {
      onChangeIndentation(blockId, currentIndent - 1);
    }
  };

  const handleIndentIncrease = (blockId: string, currentIndent: number) => {
    onChangeIndentation(blockId, currentIndent + 1);
  };

  return (
    <div
      className={`manual-indentation-controls bg-white p-4 rounded-lg border ${className}`}
    >
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">⚙️</span>
        Manual Indentation Controls
      </h3>

      {currentSolution.length === 0 ? (
        <div className="text-gray-500 italic text-center py-4">
          Add code blocks to your solution to adjust indentation
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Use the buttons below to adjust the indentation of each block in
            your solution:
          </p>

          {currentSolution.map((block, index) => (
            <div
              key={block.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded border"
            >
              <div className="flex-1 mr-4">
                <div className="font-mono text-sm">
                  {block.isCombined ? (
                    <div>
                      <span className="text-purple-600 font-medium">
                        📦 Combined Block ({block.subLines?.length || 0} lines)
                      </span>
                      {block.subLines && (
                        <div className="mt-1 ml-4 text-xs text-gray-600">
                          {block.subLines.slice(0, 2).map((line, i) => (
                            <div key={i}>{line.trim()}</div>
                          ))}
                          {block.subLines.length > 2 && (
                            <div className="text-gray-400">
                              ... and {block.subLines.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>{block.text}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 min-w-16">
                  Indent: {block.indentation}
                </span>

                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleIndentDecrease(block.id, block.indentation)
                    }
                    disabled={block.indentation === 0}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      block.indentation === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                    }`}
                    title="Decrease indentation"
                  >
                    ← Outdent
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleIndentIncrease(block.id, block.indentation)
                    }
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                    title="Increase indentation"
                  >
                    Indent →
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Validation Status */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">
              💡 Indentation Tips:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Code inside functions, if statements, and loops should be
                indented
              </li>
              <li>
                • Use consistent indentation levels (typically 4 spaces per
                level)
              </li>
              <li>
                • Lines at the same logical level should have the same
                indentation
              </li>
              <li>
                • else, elif, except align with their matching if/try statements
              </li>
            </ul>

            {hints.length > 0 && (
              <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800">
                <span className="font-medium">
                  ⚠️ Indentation Issues Found:
                </span>{' '}
                {hints.length} problem(s) detected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndentationControls;
