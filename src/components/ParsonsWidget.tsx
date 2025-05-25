import React, { useEffect, useRef, useState } from 'react';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsSettings } from '@/@types/types';
import { isParsonsWidgetLoaded, loadParsonsWidget } from '@/lib/parsonsLoader';
import * as api from '@/lib/api';

// Declare the ParsonsWidget type to match the JS library
declare global {
  interface Window {
    ParsonsWidget: any;
    jQuery: any;
    $: any;
    _: any;
    LIS: any;
  }
}

// Update the props interface
interface ParsonsWidgetProps {
  problemId?: string;
  onSolutionChange?: (solution: string[]) => void;
  onCheckSolution?: (isCorrect: boolean) => void;
}

const ParsonsWidgetComponent: React.FC<ParsonsWidgetProps> = ({
  problemId,
  onSolutionChange,
  onCheckSolution,
}) => {
  const {
    currentProblem,
    setUserSolution,
    setIsCorrect,
    incrementAttempts,
    setFeedback,
    setSocraticFeedback,
    setIsLoading,
  } = useParsonsContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const [parsonsWidget, setParsonsWidget] = useState<any>(null);
  const sortableId = 'parsons-sortable';
  const trashId = 'parsons-trash';

  // Track the current problem to detect changes
  const [lastProblemId, setLastProblemId] = useState<string | undefined>(
    problemId
  );
  const lastProblemRef = useRef<ParsonsSettings | null>(null);

  // Check if all dependencies are properly loaded
  const isDependenciesLoaded = () => {
    return (
      typeof window.jQuery !== 'undefined' &&
      typeof window.jQuery.ui !== 'undefined' &&
      typeof window.jQuery.fn.sortable === 'function' &&
      typeof window.ParsonsWidget !== 'undefined' &&
      typeof window.LIS !== 'undefined'
    );
  };

  // Initialize the widget when the component mounts or problem changes
  useEffect(() => {
    if (!currentProblem) return;

    // Check if the problem has changed - by comparing reference or ID
    const problemChanged =
      lastProblemRef.current !== currentProblem ||
      (problemId && problemId !== lastProblemId);

    // Update tracking refs
    lastProblemRef.current = currentProblem;
    if (problemId) {
      setLastProblemId(problemId);
    }

    // Only reinitialize if the problem changed or no widget exists
    if (!parsonsWidget || problemChanged) {
      // Clean up existing widget
      if (parsonsWidget) {
        // Clean up the widget (remove DOM elements, event listeners)
        cleanupWidget();
      }

      // Ensure all dependencies are loaded
      if (!isDependenciesLoaded()) {
        console.log('Loading Parsons widget dependencies...');
        loadParsonsWidget()
          .then(() => {
            if (window.ParsonsWidget) {
              initializeWidget();
            } else {
              console.error(
                'ParsonsWidget is not available after loading scripts.'
              );
            }
          })
          .catch((error) => {
            console.error('Error loading Parsons widget dependencies:', error);
          });
      } else {
        if (window.ParsonsWidget) {
          initializeWidget();
        } else {
          console.error('ParsonsWidget is not available.');
        }
      }
    }
  }, [currentProblem, problemId]);

  // Cleanup function for the widget
  const cleanupWidget = () => {
    if (!parsonsWidget) return;

    try {
      // Remove any existing feedback panels
      document
        .querySelectorAll('.parsons-feedback')
        .forEach((el) => el.remove());

      // Clean up any jQuery UI sortable instances
      if (window.jQuery) {
        try {
          window.jQuery(`#ul-${sortableId}`).sortable('destroy');
          window.jQuery(`#ul-${trashId}`).sortable('destroy');
        } catch (e) {
          console.log('Error cleaning up sortable:', e);
        }
      }

      // Clear the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      // Reset the widget state
      setParsonsWidget(null);
    } catch (error) {
      console.error('Error cleaning up widget:', error);
    }
  };

  // Separate function to initialize the widget
  const initializeWidget = () => {
    // Debug information
    console.log('Initializing ParsonsWidget');

    // Remove any existing feedback panels
    document.querySelectorAll('.parsons-feedback').forEach((el) => el.remove());

    // Clean up any previous instances
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <div id="${trashId}" class="trash-container" data-label="Drag from here"></div>
        <div id="${sortableId}" class="sortable-container" data-label="Construct your solution here"></div>
      `;
    }

    try {
      // Initialize the widget without labels
      const options = {
        sortableId: sortableId,
        trashId: trashId,
        max_wrong_lines: currentProblem.options.max_wrong_lines || 10,
        can_indent: currentProblem.options.can_indent !== false,
        x_indent: currentProblem.options.x_indent || 50,
        feedback_cb: (feedback: any) => handleFeedback(feedback),
        lang: currentProblem.options.lang || 'en',
        trash_label: '',
        solution_label: '',
        showFeedback: false,
      };

      console.log('Initializing ParsonsWidget with options:', options);
      const widget = new window.ParsonsWidget(options);
      widget.init(currentProblem.initial);
      widget.shuffleLines();
      setParsonsWidget(widget);

      // Set up a solution change observer
      const observer = new MutationObserver(() => {
        if (!widget) return;
        updateSolution(widget);
      });

      const sortableElement = document.getElementById(sortableId);
      if (sortableElement) {
        observer.observe(sortableElement, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }

      // Manual fix for the connectWith issue
      setTimeout(() => {
        if (
          window.jQuery &&
          document.getElementById(`ul-${sortableId}`) &&
          document.getElementById(`ul-${trashId}`)
        ) {
          console.log('Fixing connectWith for existing sortables');

          // Just update the connectWith option without recreating the sortables
          window
            .jQuery(`#ul-${sortableId}`)
            .sortable('option', 'connectWith', `#ul-${trashId}`);
          window
            .jQuery(`#ul-${trashId}`)
            .sortable('option', 'connectWith', `#ul-${sortableId}`);
        }
      }, 500);
    } catch (error) {
      console.error('Error initializing ParsonsWidget:', error);
    }
  };

  // Handle feedback from the widget
  const handleFeedback = (feedback: any) => {
    console.log('Raw feedback received:', feedback);

    if (feedback.success !== undefined) {
      setIsCorrect(feedback.success);

      // Extract and save the feedback content
      if (feedback.html) {
        // Clean up the HTML to extract the meaningful content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = feedback.html;

        // Extract text from the feedback HTML (simple version)
        const feedbackText = tempDiv.textContent || tempDiv.innerText || '';
        console.log('Extracted feedback text:', feedbackText);

        // Store the feedback in context
        setFeedback(feedbackText);
      } else if (feedback.message) {
        // Some implementations might provide a message property
        setFeedback(feedback.message);
      } else {
        // Default messages based on correctness
        setFeedback(feedback.success ? 'Your solution is correct!' : '');
      }

      // Add additional feedback info to context if needed
      if (!feedback.success && feedback.errors) {
        console.log('Errors:', feedback.errors);

        // Create more specific error feedback
        if (Array.isArray(feedback.errors)) {
          const errorFeedback = feedback.errors
            .map((err: any) => {
              if (typeof err === 'string') return err;
              if (err.message) return err.message;
              return JSON.stringify(err);
            })
            .join('\n');

          setFeedback((prev) => `${prev || ''}\n${errorFeedback}`);
        }
      }
    }
  };

  // Get the current solution from the widget
  const updateSolution = (widget: any) => {
    if (!widget) return;

    try {
      // First check if the sortable area exists
      const sortableElement = document.getElementById('ul-' + sortableId);
      if (!sortableElement) {
        console.warn('Sortable element not found');
        return;
      }

      // Get the solution with indentation from the widget
      const solution = widget.getModifiedCode('#ul-' + sortableId);
      const solutionLines = solution.map((line: any) => {
        // Use the widget's indentation value
        const indentSpaces = '    '.repeat(line.indent);
        return indentSpaces + line.code;
      });

      setUserSolution(solutionLines);

      if (onSolutionChange) {
        onSolutionChange(solutionLines);
      }
    } catch (error) {
      console.error('Error updating solution:', error);
    }
  };

  // Update the checkSolution function to fetch Socratic feedback
  const checkSolution = () => {
    if (!parsonsWidget) return;

    try {
      // Increment attempts
      incrementAttempts();

      // Get feedback from Parsons widget
      const feedback = parsonsWidget.getFeedback();
      console.log('Check solution feedback:', feedback);

      // Update application state
      if (feedback.success !== undefined) {
        setIsCorrect(feedback.success);

        // Extract and set feedback content from Parsons widget
        if (feedback.html) {
          setFeedback(feedback.html);
        } else if (feedback.message) {
          setFeedback(feedback.message);
        }

        // If the solution is incorrect, fetch socratic feedback from API
        if (!feedback.success) {
          // Get the current solution
          const solution = parsonsWidget
            .getModifiedCode('#ul-' + sortableId)
            .map((line: any) => {
              const indentSpaces = '    '.repeat(line.indent);
              return indentSpaces + line.code;
            });

          // Set loading state
          setIsLoading(true);

          // Call API directly
          api
            .generateFeedback(problemId || '', solution)
            .then((socraticFeedbackResult) => {
              console.log(
                'Socratic feedback received:',
                socraticFeedbackResult
              );
              setSocraticFeedback(socraticFeedbackResult);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error('Error fetching socratic feedback:', error);
              setSocraticFeedback('Error fetching feedback. Please try again.');
              setIsLoading(false);
            });
        } else {
          // Clear socratic feedback when solution is correct
          setSocraticFeedback(null);
        }

        // Call the onCheckSolution callback
        if (onCheckSolution) {
          onCheckSolution(feedback.success);
        }
      }
    } catch (error) {
      console.error('Error checking solution:', error);
      setFeedback('An error occurred while checking your solution.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupWidget();
    };
  }, []);

  return (
    <div className="parsons-widget-container">
      <div ref={containerRef} className="parsons-puzzle-container"></div>

      <div className="mt-6">
        <button
          onClick={checkSolution}
          className="px-6 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700"
        >
          Check Solution
        </button>
      </div>
    </div>
  );
};

export default ParsonsWidgetComponent;
