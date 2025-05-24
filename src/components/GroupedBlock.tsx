import React, { useRef } from 'react';

interface GroupedBlockProps {
  id: string;
  index: number;
  text: string;
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
  // Group-specific props
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isDistractor?: boolean;
  // Drag handlers
  onDragStart?: (
    e: React.DragEvent,
    area: 'sortable' | 'trash',
    block: any,
    index: number
  ) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const GroupedBlock: React.FC<GroupedBlockProps> = ({
  id,
  index,
  text,
  indentation,
  area,
  moveBlock,
  changeIndentation,
  canIndent,
  indentSize = 50,
  groupId,
  groupColor,
  isPairedDistractor = false,
  isDistractor = false,
  onDragStart,
  onDragEnd,
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

  // Create block data for drag operations
  const blockData = {
    id,
    text,
    indentation,
    isDistractor,
    groupId,
    groupColor,
    isPairedDistractor,
    isCombined: false,
  };

  // Handle native drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('GroupedBlock drag start:', id);

    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        area,
        block: blockData,
        index,
      })
    );

    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');

    if (onDragStart) {
      onDragStart(e, area, blockData, index);
    }
  };

  // Handle native drag end
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('GroupedBlock drag end:', id);
    e.currentTarget.classList.remove('opacity-50');

    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  // Handle drag over for drop zones
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Determine styling based on group and distractor status
  const getBlockStyling = () => {
    if (groupColor) {
      return `${groupColor} border-2`;
    }

    if (isDistractor) {
      return 'border-red-200 bg-red-50 border-2';
    }

    return 'border-gray-200 bg-white border-2';
  };

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      className={`flex items-center p-2 rounded shadow cursor-move transition-all duration-200 hover:shadow-md ${getBlockStyling()}`}
      style={{
        paddingLeft: `${(indentation * indentSize) / 16 + 8}px`,
      }}
    >
      {/* Indentation Controls */}
      {canIndent && area === 'sortable' && (
        <div className="flex space-x-1 mr-2">
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

      {/* Block Content */}
      <pre className="font-mono text-sm flex-1">{text}</pre>

      {/* Group and Status Indicators */}
      <div className="flex items-center space-x-1 ml-2">
        {/* Group Indicator */}
        {groupId !== undefined && (
          <span className="text-xs px-2 py-1 bg-white rounded border border-gray-300 font-medium">
            G{groupId + 1}
          </span>
        )}

        {/* Distractor Indicator */}
        {isPairedDistractor && (
          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded border border-orange-300">
            Alt
          </span>
        )}

        {/* General Distractor Indicator */}
        {isDistractor && !isPairedDistractor && (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded border border-red-300">
            ❌
          </span>
        )}
      </div>
    </div>
  );
};

export default GroupedBlock;
