import React from 'react';
import { NextPage } from 'next';
import EnhancedProblemUploader from '@/components/ProblemUploader';
import { ParsonsProvider } from '@/contexts/ParsonsContext';
import ParsonsProblemContainer from '@/components/ParsonsProblemContainer';

const TestUploaderPage: NextPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test: EnhancedProblemUploader</h1>
      
      <div className="bg-white p-6 rounded-md shadow-sm border mb-6">
        <ParsonsProvider>
          <EnhancedProblemUploader />
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Problem Preview</h2>
            <ParsonsProblemContainer showUploader={false} />
          </div>
        </ParsonsProvider>
      </div>
    </div>
  );
};

export default TestUploaderPage;