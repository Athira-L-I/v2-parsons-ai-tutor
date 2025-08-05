/**
 * Completely Isolated ParsonsWidget Component - Prevents React/jQuery conflicts
 * src/components/ParsonsWidget.tsx
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { ParsonsSettings } from '@/@types/types';
import { isParsonsWidgetLoaded, loadParsonsWidget } from '@/lib/parsonsLoader';
import { useServices } from '@/contexts/ServiceContext';

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

// Error Boundary to catch React/jQuery conflicts
class ParsonsErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      '🚨 ParsonsWidget Error Boundary caught error:',
      error,
      errorInfo
    );
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Widget Error</p>
          <p className="text-sm">
            The Parsons widget encountered an error. This usually happens due to
            React/jQuery conflicts.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
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

  // Use a container that React will never touch after creation
  const isolatedContainerRef = useRef<HTMLDivElement>(null);
  const [widgetInstance, setWidgetInstance] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<
    'loading' | 'ready' | 'error' | 'widget-ready'
  >('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Refs to track state without causing re-renders
  const currentProblemRef = useRef<ParsonsSettings | null>(null);
  const isInitializingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);

  const sortableId = `parsons-sortable-${Date.now()}`;
  const trashId = `parsons-trash-${Date.now()}`;

  // Handle errors
  const handleError = useCallback((error: Error) => {
    console.error('🚨 ParsonsWidget error:', error);
    setHasError(true);
    setErrorMessage(error.message);
    setLoadingState('error');
  }, []);

  // Load dependencies
  useEffect(() => {
    console.log('🚀 Loading Parsons dependencies...');

    if (isParsonsWidgetLoaded()) {
      console.log('✅ Dependencies already loaded');
      setLoadingState('ready');
      return;
    }

    loadParsonsWidget()
      .then(() => {
        console.log('✅ Dependencies loaded successfully');
        setLoadingState('ready');
        setErrorMessage(null);
      })
      .catch((error) => {
        console.error('❌ Failed to load dependencies:', error);
        setLoadingState('error');
        setErrorMessage(`Failed to load dependencies: ${error.message}`);
      });
  }, []);

  // Completely isolated cleanup function
  const performCleanup = useCallback(() => {
    if (cleanupInProgressRef.current) {
      console.log('🧹 Cleanup already in progress, skipping...');
      return;
    }

    cleanupInProgressRef.current = true;
    console.log('🧹 Starting isolated cleanup...');

    try {
      // Stop any observers
      if (widgetInstance?._solutionObserver) {
        widgetInstance._solutionObserver.disconnect();
        widgetInstance._solutionObserver = null;
      }

      // Clean up jQuery elements WITHOUT letting React interfere
      if (window.jQuery && isParsonsWidgetLoaded()) {
        try {
          // Find and destroy sortable instances
          const sortableSelector = `#ul-${sortableId}`;
          const trashSelector = `#ul-${trashId}`;

          const $sortable = window.jQuery(sortableSelector);
          const $trash = window.jQuery(trashSelector);

          if ($sortable.length && $sortable.data('ui-sortable')) {
            console.log('🧹 Destroying sortable instance');
            $sortable.sortable('destroy');
          }

          if ($trash.length && $trash.data('ui-sortable')) {
            console.log('🧹 Destroying trash sortable instance');
            $trash.sortable('destroy');
          }

          // Remove all jQuery UI classes and data
          window
            .jQuery(`#${sortableId}, #${trashId}`)
            .removeClass('ui-sortable ui-droppable')
            .removeData();
        } catch (jqError) {
          console.warn('⚠️ jQuery cleanup error (expected):', jqError);
        }
      }

      // Remove feedback elements
      document.querySelectorAll('.parsons-feedback').forEach((el) => {
        try {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch (removeError) {
          console.warn('⚠️ Element removal warning (expected):', removeError);
        }
      });

      // Clear the isolated container completely
      if (isolatedContainerRef.current) {
        // Use a timeout to let jQuery finish any pending operations
        setTimeout(() => {
          if (isolatedContainerRef.current) {
            try {
              isolatedContainerRef.current.innerHTML = '';
            } catch (clearError) {
              console.warn(
                '⚠️ Container clear warning (expected):',
                clearError
              );
            }
          }
        }, 100);
      }
    } catch (error) {
      console.warn(
        '⚠️ Cleanup error (expected in React/jQuery conflicts):',
        error
      );
    } finally {
      setWidgetInstance(null);
      isInitializingRef.current = false;

      // Reset cleanup flag after a delay
      setTimeout(() => {
        cleanupInProgressRef.current = false;
      }, 200);

      console.log('✅ Isolated cleanup completed');
    }
  }, [widgetInstance, sortableId, trashId]);

  // Initialize widget in completely isolated way
  const initializeWidget = useCallback(async () => {
    if (
      !currentProblem ||
      loadingState !== 'ready' ||
      isInitializingRef.current ||
      hasError
    ) {
      return;
    }

    if (!isParsonsWidgetLoaded()) {
      setLoadingState('error');
      setErrorMessage('Dependencies not properly loaded');
      return;
    }

    console.log('🔧 Initializing isolated ParsonsWidget...');
    isInitializingRef.current = true;

    try {
      // Clean up any existing widget
      performCleanup();

      // Wait for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!isolatedContainerRef.current) {
        throw new Error('Isolated container not available');
      }

      // Create a completely isolated DOM structure that React won't touch
      const isolatedHTML = `
        <div class="parsons-isolated-container" style="position: relative;">
          <div style="display: flex; gap: 1rem; min-height: 400px;">
            <div class="parsons-trash-area" style="flex: 1; border: 2px dashed #ccc; padding: 1rem; border-radius: 8px;">
              <h3 style="margin-top: 0;">Available Blocks</h3>
              <div id="${trashId}"></div>
            </div>
            <div class="parsons-solution-area" style="flex: 1; border: 2px solid #007bff; padding: 1rem; border-radius: 8px;">
              <h3 style="margin-top: 0;">Your Solution</h3>
              <div id="${sortableId}"></div>
            </div>
          </div>
        </div>
      `;

      // Set innerHTML directly (React won't manage this)
      isolatedContainerRef.current.innerHTML = isolatedHTML;

      // Wait for DOM to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify elements exist
      const trashElement = document.getElementById(trashId);
      const sortableElement = document.getElementById(sortableId);

      if (!trashElement || !sortableElement) {
        throw new Error('Failed to create isolated DOM elements');
      }

      console.log('✅ Isolated DOM structure created');

      // Create widget options
      const options = {
        sortableId: sortableId,
        trashId: trashId,
        max_wrong_lines: currentProblem.options.max_wrong_lines || 10,
        can_indent: currentProblem.options.can_indent !== false,
        x_indent: currentProblem.options.x_indent || 50,
        feedback_cb: (feedback: any) => {
          console.log('📨 Widget feedback received:', feedback);

          try {
            if (feedback.success !== undefined) {
              setIsCorrect(feedback.success);

              if (feedback.html) {
                setFeedback(feedback.html);
              } else if (feedback.message) {
                setFeedback(feedback.message);
              } else {
                setFeedback(
                  feedback.success ? 'Your solution is correct!' : ''
                );
              }
            }
          } catch (feedbackError) {
            console.error('❌ Error handling feedback:', feedbackError);
          }
        },
        lang: 'en',
        trash_label: '',
        solution_label: '',
        showFeedback: false,
      };

      console.log('📋 Creating ParsonsWidget with options:', options);

      // Create the widget instance
      const widget = new window.ParsonsWidget(options);

      // Initialize with problem code
      widget.init(currentProblem.initial);
      widget.shuffleLines();

      setWidgetInstance(widget);
      currentProblemRef.current = currentProblem;
      setLoadingState('widget-ready');
      setErrorMessage(null);

      console.log('✅ Isolated ParsonsWidget created successfully');

      // Set up solution monitoring
      setupSolutionMonitoring(widget);

      // Fix connectWith after delay
      setTimeout(() => {
        fixConnectWith();
      }, 500);
    } catch (error) {
      console.error('❌ Error initializing isolated widget:', error);
      handleError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isInitializingRef.current = false;
    }
  }, [
    currentProblem, 
    loadingState, 
    hasError, 
    performCleanup, 
    handleError, 
    setFeedback, 
    setIsCorrect, 
    sortableId, 
    trashId
  ]);

  // Fix connectWith
  const fixConnectWith = useCallback(() => {
    if (!window.jQuery || !isParsonsWidgetLoaded()) return;

    try {
      const $sortable = window.jQuery(`#ul-${sortableId}`);
      const $trash = window.jQuery(`#ul-${trashId}`);

      if ($sortable.length && $trash.length) {
        if ($sortable.sortable && $trash.sortable) {
          $sortable.sortable('option', 'connectWith', `#ul-${trashId}`);
          $trash.sortable('option', 'connectWith', `#ul-${sortableId}`);
          console.log('✅ ConnectWith configured');
        }
      }
    } catch (error) {
      console.warn('⚠️ ConnectWith configuration warning:', error);
    }
  }, [sortableId, trashId]);

  // Solution monitoring
  const setupSolutionMonitoring = useCallback(
    (widget: any) => {
      console.log('📊 Setting up solution monitoring...');

      const updateSolution = () => {
        try {
          if (!widget) return;

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
          console.warn('⚠️ Solution monitoring warning:', error);
        }
      };

      // Use polling instead of MutationObserver to avoid conflicts
      const interval = setInterval(updateSolution, 1000);

      // Store interval for cleanup
      widget._solutionInterval = interval;

      // Initial update
      setTimeout(updateSolution, 500);
    },
    [setUserSolution, onSolutionChange, sortableId]
  );

  // Access the repository services
  const { solutionRepository } = useServices();
  
  // Check solution
  const checkSolution = useCallback(async () => {
    if (!widgetInstance) {
      console.warn('⚠️ Cannot check solution: widget not ready');
      return;
    }

    console.log('🔍 Checking solution...');

    try {
      incrementAttempts();

      const feedback = widgetInstance.getFeedback();
      console.log('📨 Solution feedback:', feedback);

      if (feedback.success !== undefined) {
        setIsCorrect(feedback.success);

        if (feedback.html) {
          setFeedback(feedback.html);
        } else if (feedback.message) {
          setFeedback(feedback.message);
        }

        // Generate socratic feedback for incorrect solutions
        if (!feedback.success && problemId) {
          const solution = widgetInstance
            .getModifiedCode(`#ul-${sortableId}`)
            .map((line: any) => {
              const indentSpaces = '    '.repeat(line.indent || 0);
              return indentSpaces + (line.code || '');
            });

          setIsLoading(true);

          try {
            if (typeof problemId === 'string') {
              // Convert solution to a compatible format for the repository
              const blockArrangement = {
                blocks: solution.map((content: string, index: number) => ({
                  blockId: `block-${index}`,
                  position: index,
                  indentationLevel: 0,
                  isInSolution: true
                })),
                timestamp: Date.now(),
                attemptNumber: 1 // Use current attempt or fallback to 1
              };
              
              // Use the solution repository to generate feedback
              const validationResult = await solutionRepository.validate(problemId, blockArrangement);
              const feedbackText = validationResult.feedback.content || 
                                  validationResult.errors.map(err => err.message).join('\n') || 
                                  'Incorrect solution. Try again.';
              
              setSocraticFeedback(feedbackText);
            }
          } catch (error) {
            console.error('❌ Error fetching socratic feedback:', error);
            setSocraticFeedback('Error fetching feedback. Please try again.');
          } finally {
            setIsLoading(false);
          }
        } else {
          setSocraticFeedback(null);
        }

        if (onCheckSolution) {
          onCheckSolution(feedback.success);
        }
      }
    } catch (error) {
      console.error('❌ Error checking solution:', error);
      setFeedback('An error occurred while checking your solution.');
    }
  }, [
    widgetInstance,
    incrementAttempts,
    setIsCorrect,
    setFeedback,
    setSocraticFeedback,
    setIsLoading,
    problemId,
    onCheckSolution,
    sortableId,
    solutionRepository,
  ]);

  // Initialize widget when ready
  useEffect(() => {
    if (loadingState === 'ready' && currentProblem && !hasError) {
      const problemChanged = currentProblemRef.current !== currentProblem;

      if (problemChanged || !widgetInstance) {
        console.log('🚀 Triggering widget initialization...');
        initializeWidget();
      }
    }
  }, [
    loadingState,
    currentProblem,
    widgetInstance,
    initializeWidget,
    hasError,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, starting cleanup...');

      // Clear any intervals
      if (widgetInstance?._solutionInterval) {
        clearInterval(widgetInstance._solutionInterval);
      }

      // Perform cleanup without triggering React re-renders
      performCleanup();
    };
  }, [performCleanup, widgetInstance]);

  // Reset function
  const handleReset = useCallback(() => {
    console.log('🔄 Resetting widget...');
    setHasError(false);
    setErrorMessage(null);
    setLoadingState('loading');

    // Force cleanup and reinitialize
    performCleanup();

    setTimeout(() => {
      if (isParsonsWidgetLoaded()) {
        setLoadingState('ready');
      } else {
        setLoadingState('error');
        setErrorMessage('Dependencies not available after reset');
      }
    }, 500);
  }, [performCleanup]);

  // Render loading state
  if (loadingState === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Parsons widget...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (loadingState === 'error' || hasError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Widget Error</p>
        <p className="text-sm mt-1">
          {errorMessage || 'An unknown error occurred'}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset Widget
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ParsonsErrorBoundary onError={handleError}>
      <div className="parsons-widget-container">
        {/* Isolated container that React will never touch after creation */}
        <div
          ref={isolatedContainerRef}
          className="parsons-isolated-container"
          style={{ minHeight: '400px' }}
        />

        {widgetInstance && loadingState === 'widget-ready' && (
          <div className="mt-6">
            <button
              onClick={checkSolution}
              className="px-6 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700"
            >
              Check Solution
            </button>
          </div>
        )}

        {loadingState === 'ready' && !widgetInstance && (
          <div className="flex justify-center items-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Initializing widget...</p>
            </div>
          </div>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <p>
              <strong>Loading State:</strong> {loadingState}
            </p>
            <p>
              <strong>Widget Ready:</strong> {widgetInstance ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Has Error:</strong> {hasError ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Dependencies:</strong>{' '}
              {isParsonsWidgetLoaded() ? 'Ready' : 'Not Ready'}
            </p>
          </div>
        )}
      </div>
    </ParsonsErrorBoundary>
  );
};

export default ParsonsWidgetComponent;
