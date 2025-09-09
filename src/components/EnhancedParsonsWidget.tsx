/**
 * Enhanced ParsonsWidget with proper error handling
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { ParsonsSettings } from '@/@types/types';
import { isParsonsWidgetLoaded, loadParsonsWidget } from '@/lib/parsonsLoader';
import { useServices } from '@/contexts/ServiceContext';
import { ErrorBoundary } from '@/errors/ErrorBoundary';
import { ErrorFactory } from '@/errors/ErrorFactory';
import { useErrorHandler } from '@/errors/useErrorHandler';
import { ErrorDisplay } from '@/errors/ErrorDisplay';

declare global {
  interface Window {
    ParsonsWidget: any;
    jQuery: any;
    $: any;
    _: any;
    LIS: any;
  }
}

interface EnhancedParsonsWidgetProps {
  problemId?: string;
  onSolutionChange?: (solution: string[]) => void;
  onCheckSolution?: (isCorrect: boolean) => void;
}

const EnhancedParsonsWidget: React.FC<EnhancedParsonsWidgetProps> = ({
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

  // Use our error handling hook
  const { error, handleError, clearError } = useErrorHandler('ParsonsWidget');

  // Use a container that React will never touch after creation
  const isolatedContainerRef = useRef<HTMLDivElement>(null);
  const [widgetInstance, setWidgetInstance] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<
    'loading' | 'ready' | 'error' | 'widget-ready'
  >('loading');
  
  // Initialize the widget
  const initializeWidget = useCallback(
    async (problem: ParsonsSettings) => {
      try {
        clearError();
        setLoadingState('loading');
        
        if (!isolatedContainerRef.current) {
          throw new Error('Widget container not found');
        }
        
        // Check if dependencies are loaded
        if (!isParsonsWidgetLoaded()) {
          await loadParsonsWidget();
        }
        
        // Create widget instance with error handling
        const instance = createParsonsWidget(problem, isolatedContainerRef.current);
        setWidgetInstance(instance);
        setLoadingState('widget-ready');
      } catch (err) {
        setLoadingState('error');
        
        // Convert to app error and handle
        handleError(err, 'initializeWidget', { problemId });
      }
    },
    [clearError, handleError, problemId]
  );
  
  // Create the actual Parsons widget instance
  const createParsonsWidget = (problem: ParsonsSettings, container: HTMLDivElement) => {
    try {
      // Clear the container
      container.innerHTML = '';
      
      // Add required wrapper divs
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'parsons-widget-container';
      container.appendChild(widgetContainer);
      
      // Create widget instance
      const parsonsWidget = new window.ParsonsWidget(widgetContainer, problem);
      
      // Set up event handlers
      parsonsWidget.onSolutionChange = (solution: string[]) => {
        if (onSolutionChange) {
          onSolutionChange(solution);
        }
        setUserSolution(solution);
      };
      
      parsonsWidget.onCheckSolution = (isCorrect: boolean) => {
        if (onCheckSolution) {
          onCheckSolution(isCorrect);
        }
        setIsCorrect(isCorrect);
        incrementAttempts();
      };
      
      // Initialize the widget
      parsonsWidget.init();
      
      return parsonsWidget;
    } catch (err) {
      throw ErrorFactory.createDependencyError(
        'ParsonsWidget', 
        err instanceof Error ? err : new Error(String(err)),
        { problemSettings: problem }
      );
    }
  };
  
  // Load widget when problem changes
  useEffect(() => {
    if (currentProblem) {
      initializeWidget(currentProblem);
    }
  }, [currentProblem, initializeWidget]);
  
  // Handle widget cleanup
  useEffect(() => {
    return () => {
      // Cleanup widget
      if (widgetInstance && widgetInstance.destroy) {
        try {
          widgetInstance.destroy();
        } catch (err) {
          console.error('Error destroying widget:', err);
        }
      }
    };
  }, [widgetInstance]);
  
  // Show loading state
  if (loadingState === 'loading') {
    return <div>Loading Parsons Widget...</div>;
  }
  
  // Show error state
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onReset={() => {
          clearError();
          if (currentProblem) {
            initializeWidget(currentProblem);
          }
        }}
        showReset={true}
      />
    );
  }
  
  // Widget container (will be managed by jQuery/widget code)
  return <div ref={isolatedContainerRef} className="parsons-widget-outer-container" />;
};

// Export with error boundary
export const ParsonsWidget: React.FC<EnhancedParsonsWidgetProps> = (props) => {
  const handleWidgetError = (error: any) => {
    console.error('ParsonsWidget error caught by boundary:', error);
    // Here you could log to analytics, show toast, etc.
  };
  
  return (
    <ErrorBoundary
      component="ParsonsWidget"
      onError={handleWidgetError}
    >
      <EnhancedParsonsWidget {...props} />
    </ErrorBoundary>
  );
};
