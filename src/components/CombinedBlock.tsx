import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

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
}

interface DragItem {
  id: string;
  index: number;
  area: 'sortable' | 'trash';
  type: string;
}

const ItemTypes = {
  CODE_BLOCK: 'CODE_BLOCK',
};

const CombinedBlock: React.FC<CombinedBlockProps> = ({
  id,
  index,
  lines = [], // <-- Default to empty array
  indentation,
  area,
  moveBlock,
  changeIndentation,
  canIndent,
  indentSize = 50,
  groupColor,
  groupId,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CODE_BLOCK,
    item: () => {
      return { id, index, area, type: ItemTypes.CODE_BLOCK };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        return;
      }
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.CODE_BLOCK, ItemTypes.CODE_BLOCK],
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;
      const dragArea = item.area;
      const hoverArea = area;

      if (dragIndex === hoverIndex && dragArea === hoverArea) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset
        ? clientOffset.y - hoverBoundingRect.top
        : 0;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveBlock(dragIndex, hoverIndex, dragArea, hoverArea);

      item.index = hoverIndex;
      item.area = hoverArea;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleIndentDecrease = () => {
    if (indentation > 0) {
      changeIndentation(index, indentation - 1);
    }
  };

  const handleIndentIncrease = () => {
    changeIndentation(index, indentation + 1);
  };

  const opacity = isDragging ? 0.4 : 1;
  const calculatedIndent = indentation * (indentSize / 16);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ id, index, area })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  drag(drop(ref));

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      className={`flex flex-col p-2 bg-white rounded shadow cursor-move border-2 ${
        isOver && canDrop
          ? 'border-blue-500'
          : groupColor
          ? groupColor
          : 'border-gray-200'
      }`}
      style={{ opacity, paddingLeft: `${calculatedIndent + 8}px` }}
    >
      {/* Header with controls and group indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {canIndent && area === 'sortable' && (
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={handleIndentDecrease}
                disabled={indentation === 0}
                className={`px-2 py-0.5 text-xs rounded ${
                  indentation === 0
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleIndentIncrease}
                className="px-2 py-0.5 text-xs bg-gray-300 hover:bg-gray-400 rounded"
              >
                →
              </button>
            </div>
          )}
          <span className="text-xs text-gray-500 font-medium">
            Combined Block ({lines?.length ?? 0} lines)
          </span>
        </div>

        {groupId !== undefined && (
          <span className="text-xs px-2 py-1 bg-white rounded border">
            Group {groupId + 1}
          </span>
        )}
      </div>

      {/* Code lines with visual separators */}
      <div className="space-y-1">
        {(lines || []).map((line, lineIndex) => (
          <div key={lineIndex}>
            <pre className="font-mono text-sm text-gray-800 leading-tight">
              {line}
            </pre>
            {lineIndex < lines.length - 1 && (
              <div className="border-b border-gray-200 my-1"></div>
            )}
          </div>
        ))}
      </div>

      {/* Footer indicator */}
      <div className="mt-2 pt-1 border-t border-gray-200">
        <div className="text-xs text-gray-400 text-center">
          ⋮ Combined Block ⋮
        </div>
      </div>
    </div>
  );
};

export default CombinedBlock;
