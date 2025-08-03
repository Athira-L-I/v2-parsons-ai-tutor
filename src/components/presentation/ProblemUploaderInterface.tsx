import React from 'react';
import ProblemUploader from '../ProblemUploader';
import { ParsonsSettings } from '@/@types/types';

interface ProblemUploaderInterfaceProps {
  showUploader: boolean;
  onProblemGenerated?: (problem: ParsonsSettings) => void;
}

/**
 * Wrapper for the problem uploader component
 */
export const ProblemUploaderInterface: React.FC<ProblemUploaderInterfaceProps> = ({
  showUploader,
  onProblemGenerated,
}) => {
  if (!showUploader) {
    return null;
  }

  return (
    <div className="problem-uploader-interface mb-6">
      <ProblemUploader onProblemGenerated={onProblemGenerated} />
    </div>
  );
};
