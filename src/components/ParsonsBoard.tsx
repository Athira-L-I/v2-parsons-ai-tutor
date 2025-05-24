import React, { useEffect, useState } from 'react';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import CombinedBlock from './CombinedBlock';

interface BlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isCombined?: boolean;
  subLines?: string[];
}

const ParsonsBoard: React.FC = () => {
  const { currentProblem, userSolution, setUserSolution, isCorrect } =
    useParsonsContext();

  const [sortableBlocks, setSortableBlocks] = useState<BlockItem[]>([]);
  const [trashBlocks, setTrashBlocks] = useState<BlockItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<BlockItem | null>(null);

  // Initialize blocks from the current problem
  useEffect(() => {
    if (!currentProblem) return;

    const lines = currentProblem.initial
      .split('\n')
      .filter((line) => line.trim());
    const initialBlocks = lines.map((line, index) => {
      const isDistractor = line.includes('#distractor');
      const isPaired = line.includes('#paired');
      const cleanLine =
        isDistractor || isPaired
          ? line.replace(/#(distractor|paired)\s*$/, '')
          : line;

      // Check if this line contains combined blocks (\\n separator)
      const isCombined = cleanLine.includes('\\n');
      let subLines: string[] | undefined;
      let displayText = cleanLine.trimStart();

      if (isCombined) {
        subLines = cleanLine.split('\\n').map((subLine) => {
          // Preserve indentation in subLines
          const match = subLine.match(/^(\s*)(.*)/);
          return match ? match[0] : subLine;
        });
        displayText = `${subLines.length} combined lines`;
      }

      return {
        id: `block-${index}`,
        text: displayText,
        indentation: 0,
        isDistractor: isDistractor || isPaired,
        isCombined,
        subLines,
      };
    });

    // Shuffle only on the client
    const shuffledBlocks = [...initialBlocks].sort(() => Math.random() - 0.5);

    if (currentProblem.options.trashId) {
      setSortableBlocks([]);
      setTrashBlocks([...shuffledBlocks]);
    } else {
      setSortableBlocks([...shuffledBlocks]);
      setTrashBlocks([]);
    }
  }, [currentProblem]);

  // Update the solution in the context for validation
  const updateSolution = (blocks: BlockItem[]) => {
    const solution = blocks.map((block) => {
      const indent = '    '.repeat(block.indentation);

      if (block.isCombined && block.subLines) {
        // For combined blocks, return all sub-lines with proper indentation
        return block.subLines
          .map((subLine) => {
            // If subLine already has indentation, use it; otherwise add block indentation
            const hasIndent = /^\s+/.test(subLine);
            return hasIndent ? subLine : indent + subLine.trim();
          })
          .join('\n');
      } else {
        return `${indent}${block.text}`;
      }
    });

    setUserSolution(solution);
  };

  // Handle drag start - unified for both regular and combined blocks
  const handleDragStart = (
    e: React.DragEvent,
    area: 'sortable' | 'trash',
    block: BlockItem,
    index: number
  ) => {
    console.log('Drag start:', block.id, 'from', area);

    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        area,
        block,
        index,
      })
    );

    setDraggedItem(block);

    // Only add opacity class if this is not a combined block (they handle their own styling)
    if (!block.isCombined) {
      e.currentTarget.classList.add('opacity-50');
    }
  };

  // Handle drag end - unified for both regular and combined blocks
  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag end');
    setDraggedItem(null);

    // Only remove opacity class if this is not a combined block
    if (!e.currentTarget.classList.contains('opacity-50')) {
      e.currentTarget.classList.remove('opacity-50');
    }
  };

  // Allow drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop in sortable area
  const handleDropToSortable = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    console.log('Drop to sortable at index:', dropIndex);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      console.log('Drop data:', data);

      // If dropped from trash area
      if (data.area === 'trash') {
        const newTrashBlocks = [...trashBlocks];
        const [draggedBlock] = newTrashBlocks.splice(data.index, 1);

        const newSortableBlocks = [...sortableBlocks];
        if (dropIndex !== undefined) {
          newSortableBlocks.splice(dropIndex, 0, draggedBlock);
        } else {
          newSortableBlocks.push(draggedBlock);
        }

        setTrashBlocks(newTrashBlocks);
        setSortableBlocks(newSortableBlocks);
        updateSolution(newSortableBlocks);
      }
      // If dropped within sortable area (reordering)
      else if (data.area === 'sortable' && dropIndex !== undefined) {
        const newSortableBlocks = [...sortableBlocks];
        const [draggedBlock] = newSortableBlocks.splice(data.index, 1);
        newSortableBlocks.splice(dropIndex, 0, draggedBlock);

        setSortableBlocks(newSortableBlocks);
        updateSolution(newSortableBlocks);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Handle drop in trash area
  const handleDropToTrash = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    console.log('Drop to trash at index:', dropIndex);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      // If dropped from sortable area
      if (data.area === 'sortable') {
        const newSortableBlocks = [...sortableBlocks];
        const [draggedBlock] = newSortableBlocks.splice(data.index, 1);

        const newTrashBlocks = [...trashBlocks];
        if (dropIndex !== undefined) {
          newTrashBlocks.splice(dropIndex, 0, draggedBlock);
        } else {
          newTrashBlocks.push(draggedBlock);
        }

        setSortableBlocks(newSortableBlocks);
        setTrashBlocks(newTrashBlocks);
        updateSolution(newSortableBlocks);
      }
      // If dropped within trash area (reordering)
      else if (data.area === 'trash' && dropIndex !== undefined) {
        const newTrashBlocks = [...trashBlocks];
        const [draggedBlock] = newTrashBlocks.splice(data.index, 1);
        newTrashBlocks.splice(dropIndex, 0, draggedBlock);

        setTrashBlocks(newTrashBlocks);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const changeIndentation = (index: number, newIndent: number) => {
    if (!currentProblem?.options.can_indent) return;

    const updatedBlocks = [...sortableBlocks];
    updatedBlocks[index] = { ...updatedBlocks[index], indentation: newIndent };

    setSortableBlocks(updatedBlocks);
    updateSolution(updatedBlocks);
  };

  // Modified moveBlock function to handle combined blocks properly
  const moveBlock = (
    dragIndex: number,
    hoverIndex: number,
    sourceArea: 'sortable' | 'trash',
    targetArea: 'sortable' | 'trash'
  ) => {
    console.log(
      `Moving block from ${sourceArea}[${dragIndex}] to ${targetArea}[${hoverIndex}]`
    );
    // This will be handled by the drag/drop event handlers
  };

  // Render individual block (regular or combined)
  const renderBlock = (
    block: BlockItem,
    index: number,
    area: 'sortable' | 'trash'
  ) => {
    if (block.isCombined && block.subLines) {
      return (
        <CombinedBlock
          key={block.id}
          id={block.id}
          index={index}
          lines={block.subLines}
          indentation={block.indentation}
          area={area}
          moveBlock={moveBlock}
          changeIndentation={area === 'sortable' ? changeIndentation : () => {}}
          canIndent={
            currentProblem?.options.can_indent !== false && area === 'sortable'
          }
          indentSize={currentProblem?.options.x_indent || 50}
          groupColor={block.groupColor}
          groupId={block.groupId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      );
    } else {
      return (
        <div
          key={block.id}
          draggable
          onDragStart={(e) => handleDragStart(e, area, block, index)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={(e) => {
            e.stopPropagation();
            if (area === 'sortable') {
              handleDropToSortable(e, index);
            } else {
              handleDropToTrash(e, index);
            }
          }}
          className={`flex items-center p-2 bg-white rounded shadow cursor-move border-2 transition-all duration-200 ${
            block.groupColor ? block.groupColor : 'border-gray-200'
          } hover:shadow-md`}
          style={{
            paddingLeft: `${
              (block.indentation * (currentProblem?.options.x_indent || 50)) /
                16 +
              8
            }px`,
          }}
        >
          {currentProblem?.options.can_indent !== false &&
            area === 'sortable' && (
              <div className="flex space-x-1 mr-2">
                <button
                  type="button"
                  onClick={() => {
                    if (block.indentation > 0) {
                      changeIndentation(index, block.indentation - 1);
                    }
                  }}
                  disabled={block.indentation === 0}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    block.indentation === 0
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() =>
                    changeIndentation(index, block.indentation + 1)
                  }
                  className="px-2 py-0.5 text-xs bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                >
                  →
                </button>
              </div>
            )}
          <pre className="font-mono text-sm flex-1">{block.text}</pre>
          {block.groupId !== undefined && (
            <span className="text-xs px-2 py-1 bg-white rounded border ml-2">
              Group {block.groupId + 1}
            </span>
          )}
        </div>
      );
    }
  };

  // Enhanced drop zone component with better visual feedback
  const renderDropZone = (area: 'sortable' | 'trash', blocks: BlockItem[]) => {
    const isDropZoneActive = draggedItem !== null;

    return (
      <div
        className={`space-y-2 min-h-32 transition-all duration-200 ${
          isDropZoneActive ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          if (area === 'sortable') {
            handleDropToSortable(e);
          } else {
            handleDropToTrash(e);
          }
        }}
      >
        {blocks.map((block, index) => renderBlock(block, index, area))}
        {blocks.length === 0 && (
          <div
            className={`p-4 text-gray-500 border-2 border-dashed rounded h-32 flex items-center justify-center transition-all duration-200 ${
              isDropZoneActive
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => {
              if (area === 'sortable') {
                handleDropToSortable(e);
              } else {
                handleDropToTrash(e);
              }
            }}
          >
            {isDropZoneActive
              ? `Drop ${
                  draggedItem?.isCombined ? 'combined block' : 'block'
                } here`
              : area === 'sortable'
              ? 'Drag code blocks here to build your solution'
              : 'Drop blocks here'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* Trash area */}
      {currentProblem?.options.trashId && (
        <div
          className={`border-2 p-4 rounded-md min-h-64 w-full md:w-1/3 transition-colors ${
            isCorrect === false ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2">📦</span>
            Available Blocks
            {trashBlocks.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({trashBlocks.length} blocks)
              </span>
            )}
          </h3>
          {renderDropZone('trash', trashBlocks)}
        </div>
      )}

      {/* Solution area */}
      <div
        className={`border-2 p-4 rounded-md min-h-64 flex-1 transition-colors ${
          isCorrect === true
            ? 'border-green-300 bg-green-50'
            : isCorrect === false
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300'
        }`}
      >
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <span className="mr-2">🎯</span>
          Your Solution
          {sortableBlocks.length > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({sortableBlocks.length} blocks)
            </span>
          )}
        </h3>
        {renderDropZone('sortable', sortableBlocks)}
      </div>
    </div>
  );
};

export default ParsonsBoard;
