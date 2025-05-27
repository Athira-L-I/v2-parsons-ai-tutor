/**
 * Fixed ParsonsWidget Component with improved initialization
 * src/components/ParsonsWidget.tsx
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  // Use refs to track the current problem to detect changes
  const currentProblemRef = useRef<ParsonsSettings | null>(null);
  const isInitializingRef = useRef(false);

  const sortableId = 'parsons-sortable';
  const trashId = 'parsons-trash';

  // Load dependencies on mount
  useEffect(() => {
    console.log('🚀 ParsonsWidget: Loading dependencies...');

    if (isParsonsWidgetLoaded()) {
      console.log('✅ Dependencies already loaded');
      setDependenciesLoaded(true);
      return;
    }

    loadParsonsWidget()
      .then(() => {
        console.log('✅ Dependencies loaded successfully');
        setDependenciesLoaded(true);
        setInitializationError(null);
      })
      .catch((error) => {
        console.error('❌ Failed to load dependencies:', error);
        setInitializationError(`Failed to load dependencies: ${error.message}`);
        setDependenciesLoaded(false);
      });
  }, []);

  // Clean up widget
  const cleanupWidget = useCallback(() => {
    console.log('🧹 Cleaning up ParsonsWidget...');

    if (parsonsWidget) {
      try {
        // Remove feedback panels
        document
          .querySelectorAll('.parsons-feedback')
          .forEach((el) => el.remove());

        // Clean up jQuery UI sortable instances
        if (window.jQuery) {
          try {
            const sortableElement = window.jQuery(`#ul-${sortableId}`);
            const trashElement = window.jQuery(`#ul-${trashId}`);

            if (sortableElement.length && sortableElement.sortable) {
              sortableElement.sortable('destroy');
            }
            if (trashElement.length && trashElement.sortable) {
              trashElement.sortable('destroy');
            }
          } catch (e) {
            console.warn('⚠️ Error cleaning up sortables:', e);
          }
        }

        // Clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } catch (error) {
        console.error('❌ Error during cleanup:', error);
      }
    }

    setParsonsWidget(null);
    isInitializingRef.current = false;
  }, [parsonsWidget, sortableId, trashId]);

  // Initialize widget
  const initializeWidget = useCallback(async () => {
    if (!currentProblem || !dependenciesLoaded || isInitializingRef.current) {
      return;
    }

    console.log('🔧 Initializing ParsonsWidget with problem...');
    isInitializingRef.current = true;

    try {
      // Clean up any existing widget
      cleanupWidget();

      // Wait a bit for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify dependencies are still available
      if (!isParsonsWidgetLoaded()) {
        throw new Error('Dependencies not available during initialization');
      }

      // Create container HTML
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div id="${trashId}" class="trash-container"></div>
          <div id="${sortableId}" class="sortable-container"></div>
        `;
      }

      // Wait for DOM to update
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Initialize the widget
      const options = {
        sortableId: sortableId,
        trashId: trashId,
        max_wrong_lines: currentProblem.options.max_wrong_lines || 10,
        can_indent: currentProblem.options.can_indent !== false,
        x_indent: currentProblem.options.x_indent || 50,
        feedback_cb: handleFeedback,
        lang: currentProblem.options.lang || 'en',
        trash_label: '',
        solution_label: '',
        showFeedback: false,
      };

      console.log('📋 Creating ParsonsWidget with options:', options);
      const widget = new window.ParsonsWidget(options);

      widget.init(currentProblem.initial);
      widget.shuffleLines();

      setParsonsWidget(widget);
      currentProblemRef.current = currentProblem;

      console.log('✅ ParsonsWidget initialized successfully');

      // Set up solution change monitoring
      setupSolutionMonitoring(widget);

      // Fix connectWith after initialization
      setTimeout(() => {
        fixConnectWith();
      }, 200);
    } catch (error) {
      console.error('❌ Error initializing ParsonsWidget:', error);
      setInitializationError(`Initialization failed: ${error.message}`);
    } finally {
      isInitializingRef.current = false;
    }
  }, [currentProblem, dependenciesLoaded, cleanupWidget, sortableId, trashId]);

  // Fix connectWith for sortables
  const fixConnectWith = useCallback(() => {
    if (!window.jQuery) return;

    try {
      const sortableElement = window.jQuery(`#ul-${sortableId}`);
      const trashElement = window.jQuery(`#ul-${trashId}`);

      if (sortableElement.length && trashElement.length) {
        console.log('🔗 Fixing connectWith for sortables');

        if (sortableElement.sortable) {
          sortableElement.sortable('option', 'connectWith', `#ul-${trashId}`);
        }
        if (trashElement.sortable) {
          trashElement.sortable('option', 'connectWith', `#ul-${sortableId}`);
        }

        console.log('✅ ConnectWith fixed');
      }
    } catch (error) {
      console.warn('⚠️ Could not fix connectWith:', error);
    }
  }, [sortableId, trashId]);

  // Set up solution monitoring
  const setupSolutionMonitoring = useCallback(
    (widget: any) => {
      console.log('📊 Setting up solution monitoring...');

      const updateSolution = () => {
        if (!widget) return;

        try {
          const sortableElement = document.getElementById(`ul-${sortableId}`);
          if (!sortableElement) return;

          const solution = widget.getModifiedCode(`#ul-${sortableId}`);
          const solutionLines = solution.map((line: any) => {
            const indentSpaces = '    '.repeat(line.indent || 0);
            return indentSpaces + (line.code || '');
          });

          setUserSolution(solutionLines);

          if (onSolutionChange) {
            onSolutionChange(solutionLines);
          }
        } catch (error) {
          console.error('❌ Error updating solution:', error);
        }
      };

      // Use MutationObserver for solution changes
      const sortableElement = document.getElementById(`ul-${sortableId}`);
      if (sortableElement) {
        const observer = new MutationObserver(() => {
          // Debounce updates
          setTimeout(updateSolution, 100);
        });

        observer.observe(sortableElement, {
          childList: true,
          subtree: true,
          attributes: true,
        });

        // Store observer on widget for cleanup
        widget._solutionObserver = observer;
      }

      // Initial solution update
      setTimeout(updateSolution, 200);
    },
    [setUserSolution, onSolutionChange, sortableId]
  );

  // Handle feedback from the widget
  const handleFeedback = useCallback(
    (feedback: any) => {
      console.log('📨 Feedback received:', feedback);

      if (feedback.success !== undefined) {
        setIsCorrect(feedback.success);

        // Extract and save the feedback content
        if (feedback.html) {
          setFeedback(feedback.html);
        } else if (feedback.message) {
          setFeedback(feedback.message);
        } else {
          setFeedback(feedback.success ? 'Your solution is correct!' : '');
        }

        // Handle additional error feedback
        if (!feedback.success && feedback.errors) {
          console.log('📋 Errors:', feedback.errors);

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
    },
    [setIsCorrect, setFeedback]
  );

  // Check solution function
  const checkSolution = useCallback(async () => {
    if (!parsonsWidget) {
      console.warn('⚠️ Cannot check solution: widget not initialized');
      return;
    }

    console.log('🔍 Checking solution...');

    try {
      // Increment attempts
      incrementAttempts();

      // Get feedback from Parsons widget
      const feedback = parsonsWidget.getFeedback();
      console.log('📨 Solution feedback:', feedback);

      // Update application state
      if (feedback.success !== undefined) {
        setIsCorrect(feedback.success);

        // Extract and set feedback content
        if (feedback.html) {
          setFeedback(feedback.html);
        } else if (feedback.message) {
          setFeedback(feedback.message);
        }

        // Generate socratic feedback for incorrect solutions
        if (!feedback.success && problemId) {
          const solution = parsonsWidget
            .getModifiedCode(`#ul-${sortableId}`)
            .map((line: any) => {
              const indentSpaces = '    '.repeat(line.indent || 0);
              return indentSpaces + (line.code || '');
            });

          setIsLoading(true);

          try {
            const socraticFeedbackResult = await api.generateFeedback(
              problemId,
              solution
            );
            console.log(
              '🤔 Socratic feedback received:',
              socraticFeedbackResult
            );
            setSocraticFeedback(socraticFeedbackResult);
          } catch (error) {
            console.error('❌ Error fetching socratic feedback:', error);
            setSocraticFeedback('Error fetching feedback. Please try again.');
          } finally {
            setIsLoading(false);
          }
        } else {
          setSocraticFeedback(null);
        }

        // Call the callback
        if (onCheckSolution) {
          onCheckSolution(feedback.success);
        }
      }
    } catch (error) {
      console.error('❌ Error checking solution:', error);
      setFeedback('An error occurred while checking your solution.');
    }
  }, [
    parsonsWidget,
    incrementAttempts,
    setIsCorrect,
    setFeedback,
    setSocraticFeedback,
    setIsLoading,
    problemId,
    onCheckSolution,
    sortableId,
  ]);

  // Initialize widget when dependencies are loaded and problem changes
  useEffect(() => {
    if (dependenciesLoaded && currentProblem) {
      // Check if problem actually changed
      const problemChanged = currentProblemRef.current !== currentProblem;

      if (problemChanged || !parsonsWidget) {
        console.log(
          '🔄 Problem changed or widget not initialized, initializing...'
        );
        initializeWidget();
      }
    }
  }, [dependenciesLoaded, currentProblem, parsonsWidget, initializeWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 ParsonsWidget component unmounting, cleaning up...');
      cleanupWidget();
    };
  }, [cleanupWidget]);

  // Render loading state
  if (!dependenciesLoaded) {
    return (
      <div className="parsons-widget-container">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading Parsons widget dependencies...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (initializationError) {
    return (
      <div className="parsons-widget-container">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>
            <strong>Error:</strong> {initializationError}
          </p>
          <p>Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Render widget
  return (
    <div className="parsons-widget-container">
      <div ref={containerRef} className="parsons-puzzle-container min-h-64">
        {!parsonsWidget && currentProblem && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Initializing widget...</p>
            </div>
          </div>
        )}
      </div>

      {parsonsWidget && (
        <div className="mt-6">
          <button
            onClick={checkSolution}
            className="px-6 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={!parsonsWidget}
          >
            Check Solution
          </button>
        </div>
      )}
    </div>
  );
};

export default ParsonsWidgetComponent;
