import React from 'react';
import { IndentationHint } from '@/lib/adaptiveFeatures';

interface IndentationHelperProps {
  hints: IndentationHint[];
  onApplyHint?: (lineIndex: number) => void;
  className?: string;
}

const IndentationHelper: React.FC<IndentationHelperProps> = ({ 
  hints, 
  onApplyHint,
  className = '' 
}) => {
  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🔧</span>
        Indentation Helper
      </h3>
      
      {hints.length === 0 ? (
        <div className="text-green-600 flex items-center">
          <span className="mr-2">✅</span>
          All indentation looks correct!
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Found {hints.length} indentation issue{hints.length !== 1 ? 's' : ''}:
          </p>
          
          {hints.map((hint, index) => (
            <div key={index} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-orange-800">
                      Line {hint.lineIndex + 1}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      Current: {hint.currentIndent} → Expected: {hint.expectedIndent}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{hint.hint}</p>
                </div>
                
                {onApplyHint && (
                  <button
                    onClick={() => onApplyHint(hint.lineIndex)}
                    className="ml-3 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Fix
                  </button>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Indentation difference: {hint.expectedIndent - hint.currentIndent > 0 ? '+' : ''}{hint.expectedIndent - hint.currentIndent} level(s)
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Indentation Tips:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Code inside functions, if statements, and loops should be indented</li>
              <li>• Use 4 spaces for each indentation level</li>
              <li>• Lines at the same level should have the same indentation</li>
              <li>• else, elif, except align with their matching if/try statements</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndentationHelper;