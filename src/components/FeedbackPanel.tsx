import React from 'react';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { generateIndentationHints } from '@/lib/adaptiveFeatures';

const FeedbackPanel: React.FC = () => {
  // Use both feedback types from context
  const {
    feedback,
    socraticFeedback,
    isCorrect,
    isLoading,
    currentProblem,
    userSolution,
  } = useParsonsContext();

  // Generate indentation hints for current solution
  const getIndentationHints = () => {
    if (!currentProblem || !userSolution.length) return [];

    // Generate expected solution lines
    const expectedSolutionLines = currentProblem.initial
      .split('\n')
      .filter((line) => line.trim() && !line.includes('#distractor'));

    return generateIndentationHints(userSolution, expectedSolutionLines);
  };

  const indentationHints = getIndentationHints();
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
                <div className="prose max-w-none mb-4">
                  <h4 className="text-md font-medium mb-2">Learning Hint:</h4>
                  <div
                    className="bg-white p-3 rounded border text-sm border-blue-200 bg-blue-50"
                    dangerouslySetInnerHTML={{ __html: socraticFeedback }}
                  />
                </div>
              )}

              {!feedback && !socraticFeedback && (
                <p className="text-gray-500 italic mb-4">
                  Check your code ordering and indentation for errors.
                </p>
              )}
            </div>
          )}

          {/* Indentation Status Section */}
          {currentProblem && userSolution.length > 0 && (
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
                        {indentationHints.slice(0, 3).map((hint, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 text-orange-500">•</span>
                            <span>
                              Line {hint.lineIndex + 1}: {hint.hint}
                            </span>
                          </li>
                        ))}
                        {indentationHints.length > 3 && (
                          <li className="text-orange-600 italic">
                            ... and {indentationHints.length - 3} more issues
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isCorrect === null && (
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
