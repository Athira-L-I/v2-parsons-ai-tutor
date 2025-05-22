import React from 'react';
import { PairedDistractor } from '@/lib/adaptiveFeatures';

interface PairedDistractorVisualizerProps {
  groups: PairedDistractor[][];
}

const PairedDistractorVisualizer: React.FC<PairedDistractorVisualizerProps> = ({ groups }) => {
  const groupColors = [
    'border-purple-200 bg-purple-50',
    'border-indigo-200 bg-indigo-50', 
    'border-pink-200 bg-pink-50',
    'border-teal-200 bg-teal-50',
    'border-amber-200 bg-amber-50'
  ];

  if (groups.length === 0) {
    return (
      <div className="text-gray-500 italic p-4 text-center">
        No paired distractor groups found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <div 
          key={groupIndex}
          className={`p-3 rounded-lg border-2 ${groupColors[groupIndex % groupColors.length]}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Group {groupIndex + 1}</h4>
            <span className="text-xs text-gray-600">
              {group.length} option{group.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-2">
            {group.map((item, itemIndex) => (
              <div 
                key={item.id}
                className="p-2 rounded text-sm font-mono bg-white border border-gray-300"
              >
                {item.distractor === '' ? item.correct : item.distractor}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PairedDistractorVisualizer;