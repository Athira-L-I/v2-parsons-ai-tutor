import React from 'react';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { BlockItem } from '@/hooks/useParsonsBlocks';
import IndentationHelper from './IndentationHelper';
import { generateIndentationHints } from '@/lib/adaptiveFeatures';

interface IndentationControlsProps {
  className?: string;
}

const IndentationControls: React.FC<IndentationControlsProps> = ({
  className = '',
}) => {
  const {
    currentProblem: settings,
    currentBlocks: currentSolution,
    setCurrentBlocks,
    setUserSolution,
  } = useParsonsContext();

  if (!settings) {
    return null;
  }

  const isManualMode = settings.options.can_indent !== false;
  const isHelperMode = settings.options.can_indent === false;

  // Generate current and expected lines, and mapping for hints
  const generateSolutionData = () => {
    const currentLines: string[] = [];
    const expectedLines: string[] = [];
    const lineToBlockMapping: Array<{
      blockId: string;
      subLineIndex?: number;
    }> = [];

    const allCorrectLines = settings.initial
      .split('\n')
      .filter((line) => line.trim() && !line.includes('#distractor'));

    currentSolution.forEach((block) => {
      if (block.isCombined && block.subLines) {
        block.subLines.forEach((subLine, subIndex) => {
          const subLineRelativeIndent = Math.floor(
            (subLine.match(/^(\s*)/)?.[1].length || 0) / 4
          );
          const totalIndent = block.indentation + subLineRelativeIndent;
          const indentString = '    '.repeat(totalIndent);
          const cleanSubLine = subLine.trim();
          currentLines.push(`${indentString}${cleanSubLine}`);

          // For combined blocks, preserve the original indentation from the correct solution
          const matchingExpectedLine = allCorrectLines.find(
            (expectedLine) => expectedLine.trim() === cleanSubLine
          );

          if (matchingExpectedLine) {
            // Use the original indented line from the correct solution
            expectedLines.push(matchingExpectedLine);
          } else {
            // Fallback: preserve the original subLine structure if it has indentation
            const originalIndent = subLine.match(/^(\s*)/)?.[1] || '';
            const fallbackLine = originalIndent
              ? subLine
              : `${indentString}${cleanSubLine}`;
            expectedLines.push(fallbackLine);
          }

          lineToBlockMapping.push({
            blockId: block.id,
            subLineIndex: subIndex,
          });
        });
      } else {
        const indentString = '    '.repeat(block.indentation);
        currentLines.push(`${indentString}${block.text}`);

        const matchingExpectedLine = allCorrectLines.find(
          (expectedLine) => expectedLine.trim() === block.text.trim()
        );
        expectedLines.push(
          matchingExpectedLine || `${indentString}${block.text}`
        );

        lineToBlockMapping.push({
          blockId: block.id,
        });
      }
    });

    return { currentLines, expectedLines, lineToBlockMapping };
  };

  const { currentLines, expectedLines, lineToBlockMapping } =
    generateSolutionData();
  // Extract group IDs from blocks for enhanced indentation hints
  const blockMetadata = currentSolution.reduce((metadata, block) => {
    if (block.groupId) {
      // Convert groupId to string if it's a number
      const groupIdStr =
        typeof block.groupId === 'number'
          ? block.groupId.toString()
          : block.groupId;
      metadata[block.id] = { groupId: groupIdStr };
    }
    return metadata;
  }, {} as { [id: string]: { groupId?: string } });

  const hints = generateIndentationHints(
    currentLines,
    expectedLines,
    blockMetadata
  );

  // Update both context and userSolution when indentation changes
  const updateSolutionAndContext = (updatedBlocks: BlockItem[]) => {
    // Update context with current block structure
    setCurrentBlocks(updatedBlocks);

    // Update userSolution for backward compatibility
    const solution = updatedBlocks.map((block) => {
      const indent = '    '.repeat(block.indentation);

      if (block.isCombined && block.subLines) {
        return block.subLines
          .map((subLine) => {
            const hasIndent = /^\s+/.test(subLine);
            return hasIndent ? subLine : indent + subLine.trim();
          })
          .join('\n');
      } else {
        return `${indent}${block.text}`;
      }
    });

    setUserSolution(solution);
  };

  const onChangeIndentation = (blockId: string, newIndent: number) => {
    const updatedBlocks = currentSolution.map((block) =>
      block.id === blockId
        ? { ...block, indentation: Math.max(0, newIndent) }
        : block
    );

    updateSolutionAndContext(updatedBlocks);
  };

  const handleIndentDecrease = (blockId: string, currentIndent: number) => {
    if (currentIndent > 0) {
      onChangeIndentation(blockId, currentIndent - 1);
    }
  };

  const handleIndentIncrease = (blockId: string, currentIndent: number) => {
    onChangeIndentation(blockId, currentIndent + 1);
  };

  const handleApplyHint = (lineIndex: number) => {
    if (lineIndex >= lineToBlockMapping.length || lineIndex >= hints.length) {
      console.warn('Line index out of bounds for hint application');
      return;
    }

    const mapping = lineToBlockMapping[lineIndex];
    const hint = hints[lineIndex];

    // Apply the hint by setting the correct indentation
    onChangeIndentation(mapping.blockId, hint.expectedIndent);
  };

  // Show IndentationHelper when indentation is PROVIDED (can_indent === false)
  if (isHelperMode) {
    return (
      <IndentationHelper
        hints={hints}
        onApplyHint={handleApplyHint}
        className={className}
      />
    );
  }

  // Show manual controls when indentation is NOT provided (can_indent === true)
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
          {/*currentSolution.map((block, index) => (

          <p className="text-sm text-gray-600 mb-3">
            Use the buttons below to adjust the indentation of each block in
            your solution:
          </p>
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
                      <span className="text-xs text-blue-600 font-mono ml-2">
                        Indent: {block.indentation}
                      </span>
                      {block.subLines && (
                        <div className="mt-1 ml-4 text-xs text-gray-600">
                          {block.subLines.map((line, i) => {
                            const subLineRelativeIndent = Math.floor(
                              (line.match(/^(\s*)/)?.[1].length || 0) / 4
                            );
                            const totalIndent =
                              block.indentation + subLineRelativeIndent;
                            return (
                              <div key={i} className="flex items-center">
                                <span>
                                  {'  '.repeat(totalIndent)}└─ {line.trim()}
                                </span>
                                <span className="ml-2 text-gray-400">
                                  [{totalIndent}]
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>{block.text}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 min-w-20">
                  Base Indent: {block.indentation}
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
          ))*/}

          {/* Show current indentation issues even in manual mode */}
          {hints.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-2">
                ⚠️ Current Indentation Issues:
              </h4>
              <p className="text-sm text-orange-700 mb-2">
                Found {hints.length} indentation issue
                {hints.length !== 1 ? 's' : ''} that need fixing:
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                {hints.slice(0, 3).map((hint, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 text-orange-500">•</span>
                    <span>
                      Line {hint.lineIndex + 1}: {hint.hint}
                    </span>
                  </li>
                ))}
                {hints.length > 3 && (
                  <li className="text-orange-600 italic">
                    ... and {hints.length - 3} more issues
                  </li>
                )}
              </ul>
            </div>
          )}

          {hints.length === 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center text-green-800">
                <span className="mr-2">✅</span>
                <span className="font-medium">
                  All indentation looks correct!
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IndentationControls;
