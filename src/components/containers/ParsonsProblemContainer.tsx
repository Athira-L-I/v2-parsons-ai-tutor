import React from 'react';
import { ParsonsSettings } from '@/@types/types';
import { useProblemContext } from '@/contexts/ProblemContext';
import { ProblemDataContainer } from './ProblemDataContainer';
import { ProgressContainer } from './ProgressContainer';
import { AdaptiveContainer } from './AdaptiveContainer';
import { ProblemInterface } from '../presentation/ProblemInterface';
import { ErrorDisplay } from '../presentation/ErrorDisplay';
import { LoadingDisplay } from '../presentation/LoadingDisplay';
import { ProblemUploaderInterface } from '../presentation/ProblemUploaderInterface';

interface ParsonsProblemContainerProps {
  problemId?: string;
  initialProblem?: ParsonsSettings;
  title?: string;
  description?: string;
  showUploader?: boolean;
}

/**
 * New composed container - orchestrates other containers and components
 * Much smaller and focused compared to the original 500+ line version
 */
export const ParsonsProblemContainer: React.FC<ParsonsProblemContainerProps> = ({
  problemId,
  initialProblem,
  title = '',
  description = '',
  showUploader = false,
}) => {
  const { isLoading, error } = useProblemContext();

  return (
    <div className="parsons-problem-container">
      <ProblemUploaderInterface 
        showUploader={showUploader} 
      />
      
      <ProblemDataContainer
        problemId={problemId}
        initialProblem={initialProblem}
      >
        {({ problemData, retry }) => (
          <ProgressContainer problemId={problemId}>
            <AdaptiveContainer>
              {/* Conditional rendering based on state */}
              {isLoading && (
                <LoadingDisplay message="Loading problem..." />
              )}

              {error && !isLoading && (
                <ErrorDisplay
                  error={error}
                  onRetry={retry}
                  title="Problem Loading Error"
                />
              )}

              {!isLoading && !error && problemData && (
                <ProblemInterface
                  problemData={problemData}
                  title={title}
                  description={description}
                />
              )}

              {!isLoading && !error && !problemData && (
                <ErrorDisplay
                  error="No problem data available. Please check the problem ID or try again."
                  onRetry={retry}
                  title="No Problem Data"
                />
              )}
            </AdaptiveContainer>
          </ProgressContainer>
        )}
      </ProblemDataContainer>
    </div>
  );
};

export default ParsonsProblemContainer;
