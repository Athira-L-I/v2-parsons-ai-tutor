import React, { ReactNode } from 'react';
import { ProblemProvider } from './ProblemContext';
import { SolutionProvider } from './SolutionContext';
import { FeedbackProvider } from './FeedbackContext';
import { AdaptiveProvider } from './AdaptiveContext';
import { ChatProvider } from './ChatContext';

interface ParsonsProvidersProps {
  children: ReactNode;
}

/**
 * Composite provider that wraps all Parsons-related contexts
 * This maintains the same API as the old monolithic ParsonsProvider
 */
export const ParsonsProviders: React.FC<ParsonsProvidersProps> = ({ children }) => {
  return (
    <ProblemProvider>
      <SolutionProvider>
        <FeedbackProvider>
          <AdaptiveProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </AdaptiveProvider>
        </FeedbackProvider>
      </SolutionProvider>
    </ProblemProvider>
  );
};
