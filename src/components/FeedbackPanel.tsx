import React from 'react';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { BlockItem } from '@/hooks/useParsonsBlocks';
import { generateIndentationHints } from '@/lib/adaptiveFeatures';

const FeedbackPanel: React.FC = () => {
  const {
    feedback,
    socraticFeedback,
    isCorrect,
    isLoading,
    currentProblem,
    currentBlocks, // Now available from context
  } = useParsonsContext();

  // Use the EXACT same logic as IndentationControls
  const generateSolutionData = () => {
    if (!currentProblem || !currentBlocks || currentBlocks.length === 0) {
      return { currentLines: [], expectedLines: [], lineToBlockMapping: [] };
    }

    const currentLines: string[] = [];
    const expectedLines: string[] = [];
    const lineToBlockMapping: Array<{
      blockId: string;
      subLineIndex?: number;
    }> = [];

    const allCorrectLines = currentProblem.initial
      .split('\n')
      .filter((line) => line.trim() && !line.includes('#distractor'));

    currentBlocks.forEach((block) => {
      if (block.isCombined && block.subLines) {
        block.subLines.forEach((subLine, subIndex) => {
          const subLineRelativeIndent = Math.floor(
            (subLine.match(/^(\s*)/)?.[1].length || 0) / 4
          );
          const totalIndent = block.indentation + subLineRelativeIndent;
          const indentString = '    '.repeat(totalIndent);
          const cleanSubLine = subLine.trim();
          currentLines.push(`${indentString}${cleanSubLine}`);

          const matchingExpectedLine = allCorrectLines.find(
            (expectedLine) => expectedLine.trim() === cleanSubLine
          );
          expectedLines.push(matchingExpectedLine || subLine);

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
        expectedLines.push(matchingExpectedLine || block.text);

        lineToBlockMapping.push({
          blockId: block.id,
        });
      }
    });

    return { currentLines, expectedLines, lineToBlockMapping };
  };

  const { currentLines, expectedLines } = generateSolutionData();

  // Extract group IDs for enhanced indentation hints
  const blockMetadata = currentBlocks.reduce(
    (metadata: { [id: string]: { groupId?: string } }, block: any) => {
      if (block.groupId) {
        // Convert groupId to string if it's a number
        const groupIdStr =
          typeof block.groupId === 'number'
            ? block.groupId.toString()
            : block.groupId;
        metadata[block.id] = { groupId: groupIdStr };
      }
      return metadata;
    },
    {} as { [id: string]: { groupId?: string } }
  );

  const indentationHints = generateIndentationHints(
    currentLines,
    expectedLines,
    blockMetadata
  );
  const isIndentationProvided = currentProblem?.options.can_indent === false;

  // If there's no problem loaded, don't show feedback
  if (!currentProblem) {
    return null;
  }

  return (
    <div className="mt-6 p-4 border rounded-md">
      <h3 className="text-lg font-semibold mb-2">Feedback</h3>

      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          {isCorrect === true && (
            <div className="p-3 bg-green-100 text-green-800 rounded mb-3">
              <span className="font-bold">Correct!</span> Your solution is
              right.
            </div>
          )}

          {isCorrect === false && (
            <div>
              <div className="p-3 bg-red-100 text-red-800 rounded mb-3">
                <span className="font-bold">Not quite right.</span> Try again
                with the hints below.
              </div>

              {/* Indentation Issues - Only show when indentation is NOT provided */}
              {!isIndentationProvided && indentationHints.length > 0 && (
                <div className="prose max-w-none mb-4">
                  <h4 className="text-md font-medium mb-2 flex items-center">
                    <span className="mr-2"></span>
                    Indentation Issues ({indentationHints.length})
                  </h4>
                  <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm">
                    <p className="text-orange-700 mb-2">
                      Found {indentationHints.length} indentation issue
                      {indentationHints.length !== 1 ? 's' : ''}:
                    </p>
                    <ul className="space-y-1">
                      🔧
                      {indentationHints.slice(0, 3).map((hint, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 text-orange-500">•</span>
                          <span className="text-orange-700">
                            <strong>Line {hint.lineIndex + 1}:</strong>{' '}
                            {hint.hint}
                            <span className="text-xs ml-2 text-orange-600">
                              (Current: {hint.currentIndent}, Expected:{' '}
                              {hint.expectedIndent})
                            </span>
                          </span>
                        </li>
                      ))}
                      {indentationHints.length > 3 && (
                        <li className="text-orange-600 italic">
                          ... and {indentationHints.length - 3} more indentation
                          issues
                        </li>
                      )}
                    </ul>
                    <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                      💡 Use the indentation controls below your solution to fix
                      these issues.
                    </div>
                  </div>
                </div>
              )}

              {/* Parsons Widget Feedback */}
              {feedback && (
                <div className="prose max-w-none mb-4">
                  <h4 className="text-md font-medium mb-2">
                    Technical Issues:
                  </h4>
                  <div
                    className="bg-white p-3 rounded border text-sm"
                    dangerouslySetInnerHTML={{ __html: feedback }}
                  />
                </div>
              )}

              {/* Socratic Feedback */}
              {socraticFeedback && (
                <div className="prose max-w-none">
                  <h4 className="text-md font-medium mb-2">Learning Hint:</h4>
                  <div
                    className="bg-white p-3 rounded border text-sm border-blue-200 bg-blue-50"
                    dangerouslySetInnerHTML={{ __html: socraticFeedback }}
                  />
                </div>
              )}

              {!feedback &&
                !socraticFeedback &&
                !isIndentationProvided &&
                indentationHints.length === 0 && (
                  <p className="text-gray-500 italic">
                    Check your code ordering and indentation for errors.
                  </p>
                )}
            </div>
          )}

          {/* Indentation Status Section - Show for all cases when there are blocks */}
          {currentBlocks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2">Indentation Status:</h4>

              {isIndentationProvided ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center text-green-800">
                    <span className="mr-2">✅</span>
                    <span className="font-medium">
                      Indentation is provided automatically
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Focus on getting the code blocks in the correct order.
                  </p>
                </div>
              ) : (
                <div>
                  {indentationHints.length === 0 ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center text-green-800">
                        <span className="mr-2">✅</span>
                        <span className="font-medium">
                          All indentation looks correct!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex items-center text-orange-800 mb-2">
                        <span className="mr-2">⚠️</span>
                        <span className="font-medium">
                          {indentationHints.length} indentation issue
                          {indentationHints.length !== 1 ? 's' : ''} found
                        </span>
                      </div>
                      <p className="text-sm text-orange-700 mb-2">
                        Use the indentation controls below your solution to fix
                        these issues.
                      </p>
                      <ul className="text-sm text-orange-700 space-y-1">
                        {indentationHints.slice(0, 2).map((hint, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 text-orange-500">•</span>
                            <span>
                              Line {hint.lineIndex + 1}: Expected indent{' '}
                              {hint.expectedIndent}, got {hint.currentIndent}
                            </span>
                          </li>
                        ))}
                        {indentationHints.length > 2 && (
                          <li className="text-orange-600 italic">
                            ... and {indentationHints.length - 2} more issues
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isCorrect === null && currentBlocks.length === 0 && (
            <p className="text-gray-500 italic">
              Arrange some code blocks and submit your solution to get feedback
            </p>
          )}

          {isCorrect === null && currentBlocks.length > 0 && (
            <p className="text-gray-500 italic">
              Submit your solution to get feedback
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;
