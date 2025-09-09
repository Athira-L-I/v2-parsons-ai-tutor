import React, { useState } from 'react';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { ValidationService } from '@/lib/validationService';
import { generateIndentationHints } from '@/lib/adaptiveFeatures';

interface SolutionCheckerProps {
  problemId?: string;
  onCheckComplete?: (isCorrect: boolean) => void;
}

const SolutionChecker: React.FC<SolutionCheckerProps> = ({
  problemId,
  onCheckComplete,
}) => {
  const {
    currentProblem,
    userSolution,
    setFeedback,
    setIsCorrect,
    isCorrect,
    isLoading,
    setIsLoading,
    incrementAttempts,
    currentBlocks,
    chatMessages,
    addChatMessage,
    removeTypingMessages,
    attempts,
  } = useParsonsContext();

  const [validationService] = useState(() => new ValidationService());
  const [lastAttemptCount, setLastAttemptCount] = useState(0);

  const generateContextualChatStarter = (
    isCorrect: boolean,
    userSolution: string[],
    currentProblem: any,
    currentBlocks: any[]
  ): string => {
    if (isCorrect) {
      return "Great job! Your solution is correct! 🎉 Is there anything about this problem you'd like to understand better?";
    }

    // Analyze the type of error to provide contextual starter
    let starterMessage =
      "I can see you're working on this problem. Let me help you figure this out! ";

    // Check for indentation issues
    if (currentProblem && currentBlocks.length > 0) {
      const allCorrectLines = currentProblem.initial
        .split('\n')
        .filter((line: string) => line.trim() && !line.includes('#distractor'));

      const currentLines: string[] = [];
      const expectedLines: string[] = [];
      currentBlocks.forEach((block: any) => {
        if (block.isCombined && block.subLines) {
          block.subLines.forEach((subLine: string) => {
            const subLineRelativeIndent = Math.floor(
              (subLine.match(/^(\s*)/)?.[1].length || 0) / 4
            );
            const totalIndent = block.indentation + subLineRelativeIndent;
            const indentString = '    '.repeat(totalIndent);
            const cleanSubLine = subLine.trim();
            currentLines.push(`${indentString}${cleanSubLine}`);

            // For combined blocks, find the matching expected line and preserve its indentation
            const matchingExpectedLine = allCorrectLines.find(
              (expectedLine: string) => expectedLine.trim() === cleanSubLine
            );

            if (matchingExpectedLine) {
              // Use the original indented line from the correct solution
              expectedLines.push(matchingExpectedLine);
            } else {
              // Fallback: create properly indented line based on the original subLine structure
              // If the subLine already has indentation, preserve it; otherwise use the current structure
              const originalIndent = subLine.match(/^(\s*)/)?.[1] || '';
              const fallbackLine = originalIndent
                ? subLine
                : `${indentString}${cleanSubLine}`;
              expectedLines.push(fallbackLine);
            }
          });
        } else {
          const indentString = '    '.repeat(block.indentation);
          currentLines.push(`${indentString}${block.text}`);

          const matchingExpectedLine = allCorrectLines.find(
            (expectedLine: string) => expectedLine.trim() === block.text.trim()
          );
          expectedLines.push(
            matchingExpectedLine || `${indentString}${block.text}`
          );
        }
      });

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

      if (indentationHints.length > 0) {
        const isIndentationProvided =
          currentProblem.options.can_indent === false;
        if (!isIndentationProvided) {
          starterMessage +=
            'I notice there might be some indentation issues. In Python, indentation is really important - it shows which lines belong together. What do you think about the indentation in your current solution?';
          return starterMessage;
        }
      }
    }

    // Check for order/logic issues
    if (userSolution.length === 0) {
      starterMessage +=
        "I see you haven't arranged any code blocks yet. What do you think should be the very first step in this program?";
    } else if (
      currentProblem &&
      userSolution.length <
        currentProblem.initial
          .split('\n')
          .filter(
            (line: string) => line.trim() && !line.includes('#distractor')
          ).length
    ) {
      starterMessage +=
        "You've made a good start! It looks like you might be missing some pieces. What do you think should come next in your solution?";
    } else {
      // Check what type of program this is
      const codeText = userSolution.join(' ').toLowerCase();

      if (codeText.includes('def ')) {
        starterMessage +=
          "I see you're working with a function. What do you think this function is supposed to do, and are all the pieces in the right order?";
      } else if (codeText.includes('for ') || codeText.includes('while ')) {
        starterMessage +=
          "I notice there's a loop in your solution. What should happen before the loop starts, and what should happen inside the loop?";
      } else if (codeText.includes('if ')) {
        starterMessage +=
          'I see you have a conditional statement. What condition are you checking, and what should happen in each case?';
      } else {
        starterMessage +=
          "Let's think about the logical flow of your program. What should happen first, second, and so on?";
      }
    }

    return starterMessage;
  };

  const shouldStartChat = (): boolean => {
    // Only start chat if:
    // 1. Solution is incorrect
    // 2. Chat is empty (no messages yet)
    // 3. This is a new attempt (attempt count has increased)
    return (
      isCorrect === false &&
      chatMessages.length === 0 &&
      attempts > lastAttemptCount
    );
  };

  const handleCheckSolution = async () => {
    if (!userSolution.length) {
      setFeedback(
        'Please arrange some code blocks before checking your solution.'
      );
      return;
    }

    setIsLoading(true);
    const previousAttemptCount = attempts;
    incrementAttempts();
    setLastAttemptCount(attempts + 1);

    try {
      let checkResult;

      if (problemId) {
        // Use backend validation
        checkResult = await validationService.validateSolution(
          problemId,
          userSolution
        );
        setIsCorrect(checkResult.isCorrect);

        // Generate feedback based on result
        if (!checkResult.isCorrect) {
          const feedbackText = await validationService.generateFeedback(
            problemId,
            userSolution
          );
          setFeedback(feedbackText);
        } else {
          setFeedback('Great job! Your solution is correct.');
        }
      } else if (currentProblem) {
        // Use local validation
        checkResult = validationService.validateSolutionLocally(
          currentProblem,
          userSolution
        );
        setIsCorrect(checkResult.isCorrect);

        // Generate local feedback
        if (!checkResult.isCorrect) {
          const feedbackText = validationService.generateLocalFeedback(
            currentProblem,
            userSolution
          );
          setFeedback(feedbackText);
        } else {
          setFeedback('Great job! Your solution is correct.');
        }
      } else {
        setFeedback('No problem is currently loaded.');
        checkResult = { isCorrect: false, details: 'No problem loaded' };
        setIsCorrect(false);
      }

      // Auto-start chat for incorrect solutions
      if (checkResult && !checkResult.isCorrect && chatMessages.length === 0) {
        console.log('🤖 Auto-starting chat for incorrect solution');

        // Generate contextual starter message
        const starterMessage = generateContextualChatStarter(
          checkResult.isCorrect,
          userSolution,
          currentProblem,
          currentBlocks || []
        );

        // Add the starter message after a short delay to let other UI updates happen first
        setTimeout(() => {
          addChatMessage({
            role: 'tutor',
            content: starterMessage,
          });
        }, 500);
      }

      // Call the callback if provided
      if (onCheckComplete) {
        onCheckComplete(checkResult.isCorrect);
      }
    } catch (error) {
      console.error('Error checking solution:', error);
      setFeedback(
        'There was an error checking your solution. Please try again.'
      );
      setIsCorrect(false);

      // Even for errors, we might want to start a helpful chat
      if (chatMessages.length === 0) {
        setTimeout(() => {
          addChatMessage({
            role: 'tutor',
            content:
              "I encountered an issue while checking your solution, but I'm still here to help! What specific part of this problem would you like to work on together?",
          });
        }, 500);
      }

      // Call the callback with false in case of error
      if (onCheckComplete) {
        onCheckComplete(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleCheckSolution}
        disabled={isLoading || !userSolution.length}
        className={`px-6 py-2 rounded-md text-white font-medium ${
          isLoading || !userSolution.length
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Checking...' : 'Check Solution'}
      </button>

      {userSolution.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">
          Arrange code blocks to build your solution, then click "Check
          Solution".
        </p>
      )}

      {/* Auto-chat indicator */}
      {isCorrect === false && chatMessages.length > 0 && (
        <p className="mt-2 text-sm text-blue-600">
          💬 I've started a conversation below to help you work through this
          problem!
        </p>
      )}
    </div>
  );
};

export default SolutionChecker;
