import React, { useRef } from 'react';

interface CombinedBlockProps {
  id: string;
  index: number;
  lines: string[];
  indentation: number;
  area: 'sortable' | 'trash';
  moveBlock: (
    dragIndex: number,
    hoverIndex: number,
    sourceArea: 'sortable' | 'trash',
    targetArea: 'sortable' | 'trash'
  ) => void;
  changeIndentation: (index: number, newIndent: number) => void;
  canIndent: boolean;
  indentSize?: number;
  groupColor?: string;
  groupId?: number;
  // Add these props to match ParsonsBoard's expectations
  onDragStart?: (
    e: React.DragEvent,
    area: 'sortable' | 'trash',
    block: any,
    index: number
  ) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const CombinedBlock: React.FC<
  CombinedBlockProps & { isDragging?: boolean }
> = ({
  id,
  index,
  lines = [],
  indentation,
  area,
  moveBlock,
  changeIndentation,
  canIndent,
  indentSize = 50,
  groupColor,
  groupId,
  onDragStart,
  onDragEnd,
  isDragging = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleIndentDecrease = () => {
    if (indentation > 0) {
      changeIndentation(index, indentation - 1);
    }
  };

  const handleIndentIncrease = () => {
    changeIndentation(index, indentation + 1);
  };

  // Create a block object that matches what ParsonsBoard expects
  const blockData = {
    id,
    text: `${lines.length} combined lines`,
    indentation,
    isDistractor: false,
    groupId,
    groupColor,
    isCombined: true,
    subLines: lines,
  };

  // Handle native drag start - this makes it compatible with ParsonsBoard
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('CombinedBlock drag start:', id);

    // Set the drag data in the format ParsonsBoard expects
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        area,
        block: blockData,
        index,
      })
    );

    e.dataTransfer.effectAllowed = 'move';
    // e.currentTarget.classList.add('opacity-50');

    // Call the parent's drag start handler if provided
    if (onDragStart) {
      onDragStart(e, area, blockData, index);
    }
  };

  // Handle native drag end
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('CombinedBlock drag end:', id);
    // e.currentTarget.classList.remove('opacity-50');

    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  // Handle drag over for drop zones
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      className={`flex flex-col p-2 bg-white rounded shadow cursor-move border-2 transition-all duration-200 ${
        groupColor ? groupColor : 'border-gray-200'
      } hover:shadow-md ${isDragging ? 'opacity-50' : ''}`}
      style={{
        marginLeft: `${indentation * indentSize}px`,
        paddingLeft: '8px',
      }}
    >
      {/* Header with controls and group indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {/* Only show manual indentation controls when can_indent is true */}
          {canIndent && area === 'sortable' && (
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={handleIndentDecrease}
                disabled={indentation === 0}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  indentation === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleIndentIncrease}
                className="px-2 py-0.5 text-xs bg-gray-300 hover:bg-gray-400 rounded transition-colors"
              >
                →
              </button>
            </div>
          )}
          <span className="text-xs text-gray-500 font-medium">
            📦 Combined Block ({lines?.length ?? 0} lines)
          </span>
          {!canIndent && area === 'sortable' && (
            <span className="text-xs text-green-600 font-medium ml-2">
              ✓ Indentation Provided
            </span>
          )}
        </div>

        {groupId !== undefined && (
          <span className="text-xs px-2 py-1 bg-white rounded border border-gray-300">
            Group {groupId + 1}
          </span>
        )}
      </div>

      {/* Code lines with visual separators */}
      <div className="space-y-1 bg-gray-50 p-2 rounded">
        {(lines || []).map((line, lineIndex) => (
          <div key={lineIndex}>
            <pre className="font-mono text-sm text-gray-800 leading-tight whitespace-pre-wrap">
              {line}
            </pre>
            {lineIndex < lines.length - 1 && (
              <div className="border-b border-gray-300 my-1 opacity-50"></div>
            )}
          </div>
        ))}
      </div>

      {/* Footer indicator */}
      <div className="mt-2 pt-1 border-t border-gray-200">
        <div className="text-xs text-gray-400 text-center flex items-center justify-center space-x-1">
          <span>⋮</span>
          <span className="font-medium">Combined Block</span>
          <span>⋮</span>
        </div>
      </div>
    </div>
  );
};

export default CombinedBlock;
