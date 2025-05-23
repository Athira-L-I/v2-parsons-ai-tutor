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

  // Handle drag start
  const handleDragStart = (
    e: React.DragEvent,
    area: 'sortable' | 'trash',
    block: BlockItem,
    index: number
  ) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        area,
        block,
        index,
      })
    );

    setDraggedItem(block);
    e.currentTarget.classList.add('opacity-50');
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    e.currentTarget.classList.remove('opacity-50');
  };

  // Allow drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop in sortable area
  const handleDropToSortable = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

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
          className={`flex items-center p-2 bg-white rounded shadow cursor-move border-2 ${
            block.groupColor ? block.groupColor : 'border-gray-200'
          }`}
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
                  className={`px-2 py-0.5 text-xs rounded ${
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
                  className="px-2 py-0.5 text-xs bg-gray-300 hover:bg-gray-400 rounded"
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

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* Trash area */}
      {currentProblem?.options.trashId && (
        <div
          className={`border-2 p-4 rounded-md min-h-64 w-full md:w-1/3 ${
            isCorrect === false ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <h3 className="text-lg font-semibold mb-2">Available Blocks</h3>
          <div
            className="space-y-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropToTrash(e)}
          >
            {trashBlocks.map((block, index) =>
              renderBlock(block, index, 'trash')
            )}
            {trashBlocks.length === 0 && (
              <div
                className="p-4 text-gray-500 border border-dashed rounded h-16 flex items-center justify-center"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropToTrash(e)}
              >
                Drop blocks here
              </div>
            )}
          </div>
        </div>
      )}

      {/* Solution area */}
      <div
        className={`border-2 p-4 rounded-md min-h-64 flex-1 ${
          isCorrect === true
            ? 'border-green-300'
            : isCorrect === false
            ? 'border-red-300'
            : 'border-gray-300'
        }`}
      >
        <h3 className="text-lg font-semibold mb-2">Your Solution</h3>
        <div
          className="space-y-2 min-h-32"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToSortable(e)}
        >
          {sortableBlocks.map((block, index) =>
            renderBlock(block, index, 'sortable')
          )}
          {sortableBlocks.length === 0 && (
            <div
              className="p-4 text-gray-500 border border-dashed rounded h-32 flex items-center justify-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropToSortable(e)}
            >
              Drag code blocks here to build your solution
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParsonsBoard;
