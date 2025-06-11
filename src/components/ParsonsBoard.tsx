import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsSettings } from '@/@types/types';
import CombinedBlock from './CombinedBlock';

const IndentationControls = dynamic(() => import('./IndentationControls'), {
  ssr: false,
});

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

// ✅ Custom hook to extract solution generation logic
const useSolutionGeneration = () => {
  const generateSolutionFromBlocks = useCallback((blocks: BlockItem[]) => {
    return blocks.map((block) => {
      const indent = '    '.repeat(block.indentation);

      if (block.isCombined && block.subLines) {
        return block.subLines
          .map((subLine) => {
            const hasIndent = /^\s+/.test(subLine);
            return hasIndent ? subLine : indent + subLine.trim();
          })
          .join('\n');
      } else {
        return `${indent}${block.text}`;
      }
    });
  }, []);

  return { generateSolutionFromBlocks };
};

// ✅ Custom hook for block management
const useBlockManagement = (
  currentProblem: ParsonsSettings | null,
  setUserSolution: (solution: string[]) => void,
  setCurrentBlocks?: (blocks: BlockItem[]) => void
) => {
  const [sortableBlocks, setSortableBlocks] = useState<BlockItem[]>([]);
  const [trashBlocks, setTrashBlocks] = useState<BlockItem[]>([]);
  const { generateSolutionFromBlocks } = useSolutionGeneration();

  const updateSolution = useCallback(
    (blocks: BlockItem[]) => {
      const solution = generateSolutionFromBlocks(blocks);
      setUserSolution(solution);

      if (setCurrentBlocks) {
        setCurrentBlocks(blocks);
      }
    },
    [generateSolutionFromBlocks, setUserSolution, setCurrentBlocks]
  );

  const updateBlocks = useCallback(
    (newSortableBlocks: BlockItem[], newTrashBlocks?: BlockItem[]) => {
      setSortableBlocks(newSortableBlocks);
      if (newTrashBlocks !== undefined) {
        setTrashBlocks(newTrashBlocks);
      }
      updateSolution(newSortableBlocks);
    },
    [updateSolution]
  );

  // ✅ Fixed circular dependency
  const changeIndentation = useCallback(
    (blockId: string, newIndent: number) => {
      if (!currentProblem?.options.can_indent) return;

      setSortableBlocks((prevBlocks) => {
        const updatedBlocks = prevBlocks.map((block) =>
          block.id === blockId ? { ...block, indentation: newIndent } : block
        );

        // Update solution immediately with the new blocks
        updateSolution(updatedBlocks);
        return updatedBlocks;
      });
    },
    [currentProblem?.options.can_indent, updateSolution]
  );

  return {
    sortableBlocks,
    trashBlocks,
    setSortableBlocks,
    setTrashBlocks,
    updateBlocks,
    updateSolution,
    changeIndentation,
  };
};

// ✅ Custom hook for drag and drop
const useDragAndDrop = (
  blocks: { sortableBlocks: BlockItem[]; trashBlocks: BlockItem[] },
  updateBlocks: (sortableBlocks: BlockItem[], trashBlocks?: BlockItem[]) => void
) => {
  const [draggedItem, setDraggedItem] = useState<BlockItem | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (
      e: React.DragEvent,
      area: 'sortable' | 'trash',
      block: BlockItem,
      index: number
    ) => {
      console.log('Drag start:', block.id, 'from', area);

      const dragData = { area, block, index };
      e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'move';

      setDraggedItem(block);
      setDraggedBlockId(block.id);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    console.log('Drag end');
    setDraggedItem(null);
    setDraggedBlockId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropToSortable = useCallback(
    (e: React.DragEvent, dropIndex?: number) => {
      e.preventDefault();
      console.log('Drop to sortable at index:', dropIndex);

      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));

        if (data.area === 'trash') {
          const newTrashBlocks = [...blocks.trashBlocks];
          const [draggedBlock] = newTrashBlocks.splice(data.index, 1);

          const newSortableBlocks = [...blocks.sortableBlocks];
          const insertIndex = dropIndex ?? newSortableBlocks.length;
          newSortableBlocks.splice(insertIndex, 0, draggedBlock);

          updateBlocks(newSortableBlocks, newTrashBlocks);
        } else if (data.area === 'sortable' && dropIndex !== undefined) {
          const newSortableBlocks = [...blocks.sortableBlocks];
          const [draggedBlock] = newSortableBlocks.splice(data.index, 1);
          newSortableBlocks.splice(dropIndex, 0, draggedBlock);

          updateBlocks(newSortableBlocks);
        }
      } catch (error) {
        console.error('Error handling drop:', error);
      } finally {
        handleDragEnd();
      }
    },
    [blocks, updateBlocks, handleDragEnd]
  );

  const handleDropToTrash = useCallback(
    (e: React.DragEvent, dropIndex?: number) => {
      e.preventDefault();
      console.log('Drop to trash at index:', dropIndex);

      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));

        if (data.area === 'sortable') {
          const newSortableBlocks = [...blocks.sortableBlocks];
          const [draggedBlock] = newSortableBlocks.splice(data.index, 1);

          const newTrashBlocks = [...blocks.trashBlocks];
          const insertIndex = dropIndex ?? newTrashBlocks.length;
          newTrashBlocks.splice(insertIndex, 0, draggedBlock);

          updateBlocks(newSortableBlocks, newTrashBlocks);
        } else if (data.area === 'trash' && dropIndex !== undefined) {
          const newTrashBlocks = [...blocks.trashBlocks];
          const [draggedBlock] = newTrashBlocks.splice(data.index, 1);
          newTrashBlocks.splice(dropIndex, 0, draggedBlock);

          updateBlocks(blocks.sortableBlocks, newTrashBlocks);
        }
      } catch (error) {
        console.error('Error handling drop:', error);
      } finally {
        handleDragEnd();
      }
    },
    [blocks, updateBlocks, handleDragEnd]
  );

  return {
    draggedItem,
    draggedBlockId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDropToSortable,
    handleDropToTrash,
  };
};

const ParsonsBoard: React.FC = () => {
  const { currentProblem, setUserSolution, isCorrect, setCurrentBlocks } =
    useParsonsContext();
  const {
    sortableBlocks,
    trashBlocks,
    setSortableBlocks,
    setTrashBlocks,
    updateBlocks,
    changeIndentation,
  } = useBlockManagement(currentProblem, setUserSolution, setCurrentBlocks);

  const {
    draggedItem,
    draggedBlockId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDropToSortable,
    handleDropToTrash,
  } = useDragAndDrop({ sortableBlocks, trashBlocks }, updateBlocks);  // ✅ Block initialization with adaptive features support - Smart re-initialization
  useEffect(() => {
    if (!currentProblem) return;

    // Check if we actually need to re-initialize blocks
    const hasBlocks = sortableBlocks.length > 0 || trashBlocks.length > 0;
    
    // Only re-initialize if:
    // 1. No blocks exist yet (first time)
    // 2. The problem structure has significantly changed (different line count or structure)
    const lines = currentProblem.initial
      .split('\n')
      .filter((line) => line.trim());
    
    const expectedBlockCount = lines.length;
    const currentBlockCount = sortableBlocks.length + trashBlocks.length;
    
    // Skip re-initialization if blocks already exist and count matches expected
    if (hasBlocks && currentBlockCount === expectedBlockCount) {
      console.log('🔄 Skipping block re-initialization - blocks already exist and count matches');
      return;
    }
    
    console.log('🔄 Initializing blocks from problem:', {
      totalLines: lines.length,
      combinedLines: lines.filter(line => line.includes('\\n')).length,
      distractorLines: lines.filter(line => line.includes('#distractor')).length,
      hasExistingBlocks: hasBlocks,
      currentBlockCount,
      expectedBlockCount
    });

    const initialBlocks = lines.map((line, index) => {
      const isDistractor = line.includes('#distractor');
      const isPaired = line.includes('#paired');
      const cleanLine =
        isDistractor || isPaired
          ? line.replace(/#(distractor|paired)\s*$/, '').trim()
          : line.trim();

      // Check for combined blocks (lines with \\n separator)
      const isCombined = cleanLine.includes('\\n');
      let subLines: string[] | undefined;
      let displayText = cleanLine;
      let correctIndentation = 0;

      if (isCombined) {        // Split combined blocks and preserve original indentation
        subLines = cleanLine.split('\\n').map((subLine) => {
          // Keep the original formatting including leading whitespace
          const trimmedSubLine = subLine.trim();
          if (trimmedSubLine) {
            // Extract indentation from the original line if it exists
            const originalIndent = subLine.match(/^(\s*)/)?.[1] || '';
            return originalIndent + trimmedSubLine;
          }
          return subLine;
        }).filter(subLine => subLine.trim()); // Remove empty lines

        displayText = `${subLines.length} combined lines`;
        
        // Use the indentation from the first non-empty subline
        const firstSubLine = subLines[0] || '';
        correctIndentation = Math.floor(
          (firstSubLine.match(/^(\s*)/)?.[1].length || 0) / 4
        );
        
        console.log('📦 Created combined block:', {
          id: `block-${index}`,
          subLines: subLines.length,
          firstLine: subLines[0]?.substring(0, 30) + '...',
          indentation: correctIndentation
        });
      } else {
        // Regular single line block
        correctIndentation = Math.floor(
          (line.match(/^(\s*)/)?.[1].length || 0) / 4
        );
        displayText = cleanLine;
      }

      return {
        id: `block-${index}`,
        text: displayText,
        indentation:
          currentProblem.options.can_indent === false ? correctIndentation : 0,
        isDistractor: isDistractor || isPaired,
        isCombined,
        subLines,
      };
    });    const shuffledBlocks = [...initialBlocks].sort(() => Math.random() - 0.5);

    console.log('🎲 Shuffled blocks created:', {
      total: shuffledBlocks.length,
      combined: shuffledBlocks.filter(b => b.isCombined).length,
      distractors: shuffledBlocks.filter(b => b.isDistractor).length
    });

    if (currentProblem.options.trashId) {
      updateBlocks([], shuffledBlocks);
    } else {
      updateBlocks(shuffledBlocks, []);
    }
    
    console.log('✅ Block initialization complete');
  }, [currentProblem, updateBlocks, sortableBlocks.length, trashBlocks.length]); // Added block lengths to dependencies

  // ✅ Handle indentation mode changes
  useEffect(() => {
    if (!currentProblem) return;

    const isIndentationProvided = currentProblem.options.can_indent === false;

    if (isIndentationProvided) {
      const updateBlocksWithCorrectIndentation = (blocks: BlockItem[]) => {
        return blocks.map((block) => {
          const lines = currentProblem.initial
            .split('\n')
            .filter((line) => line.trim());
          let correctIndentation = 0;

          for (const line of lines) {
            const cleanLine = line
              .replace(/#(distractor|paired)\s*$/, '')
              .trim();

            if (block.isCombined && block.subLines) {
              const firstSubLine = block.subLines[0]?.trim();
              if (cleanLine.includes(firstSubLine)) {
                correctIndentation = Math.floor(
                  (line.match(/^(\s*)/)?.[1].length || 0) / 4
                );
                break;
              }
            } else {
              if (cleanLine === block.text) {
                correctIndentation = Math.floor(
                  (line.match(/^(\s*)/)?.[1].length || 0) / 4
                );
                break;
              }
            }
          }

          return { ...block, indentation: correctIndentation };
        });
      };

      setSortableBlocks((prev) => updateBlocksWithCorrectIndentation(prev));
      setTrashBlocks((prev) => updateBlocksWithCorrectIndentation(prev));
    }
  }, [currentProblem, setSortableBlocks, setTrashBlocks]);
  // ✅ Optimized drop handlers
  const handleSortableDropHandler = useCallback(
    (e: React.DragEvent, index?: number) => {
      e.stopPropagation();
      handleDropToSortable(e, index);
    },
    [handleDropToSortable]
  );

  const handleTrashDropHandler = useCallback(
    (e: React.DragEvent, index?: number) => {
      e.stopPropagation();
      handleDropToTrash(e, index);
    },
    [handleDropToTrash]
  );

  // ✅ Optimized indentation handlers for blocks
  const createIndentationHandlers = useCallback(
    (blockId: string, currentIndentation: number) => ({
      onIndentDecrease: () => {
        if (currentIndentation > 0) {
          changeIndentation(blockId, currentIndentation - 1);
        }
      },
      onIndentIncrease: () => {
        changeIndentation(blockId, currentIndentation + 1);
      },
    }),
    [changeIndentation]
  );

  // ✅ Optimized combined block indentation handler
  const createCombinedBlockIndentationHandler = useCallback(
    (blockId: string, area: 'sortable' | 'trash') => {
      if (area === 'sortable') {
        return (idx: number, newIndent: number) =>
          changeIndentation(blockId, newIndent);
      }
      return () => {};
    },
    [changeIndentation]
  );

  // ✅ Memoized render functions
  const renderBlock = useCallback(
    (block: BlockItem, index: number, area: 'sortable' | 'trash') => {
      if (block.isCombined && block.subLines) {
        return (
          <CombinedBlock
            key={block.id}
            id={block.id}
            index={index}
            lines={block.subLines}
            indentation={block.indentation}
            area={area}
            moveBlock={() => {}} // Simplified since drag/drop handles this
            changeIndentation={createCombinedBlockIndentationHandler(
              block.id,
              area
            )}
            canIndent={
              currentProblem?.options.can_indent !== false &&
              area === 'sortable'
            }
            indentSize={currentProblem?.options.x_indent || 50}
            groupColor={block.groupColor}
            groupId={block.groupId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isDragging={draggedBlockId === block.id}
          />
        );
      }

      const indentationHandlers = createIndentationHandlers(
        block.id,
        block.indentation
      );

      return (
        <div
          key={block.id}
          draggable
          onDragStart={(e) => handleDragStart(e, area, block, index)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={
            area === 'sortable'
              ? (e) => handleSortableDropHandler(e, index)
              : (e) => handleTrashDropHandler(e, index)
          }
          className={`flex items-center p-2 bg-white rounded shadow cursor-move border-2 transition-all duration-200 ${
            block.groupColor ? block.groupColor : 'border-gray-200'
          } hover:shadow-md ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
          style={{
            marginLeft: `${
              block.indentation * (currentProblem?.options.x_indent || 50)
            }px`,
            paddingLeft: '8px',
          }}
        >
          {/* Indentation controls */}
          {currentProblem?.options.can_indent !== false &&
            area === 'sortable' && (
              <div className="flex space-x-1 mr-2">
                <button
                  type="button"
                  onClick={indentationHandlers.onIndentDecrease}
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
                  onClick={indentationHandlers.onIndentIncrease}
                  className="px-2 py-0.5 text-xs bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                >
                  →
                </button>
              </div>
            )}

          {/* Indentation indicator */}
          {currentProblem?.options.can_indent === false &&
            block.indentation > 0 &&
            area === 'sortable' && (
              <div className="flex items-center mr-2">
                <span className="text-xs text-green-600 font-mono">
                  {'····'.repeat(block.indentation)}
                </span>
              </div>
            )}

          <pre className="font-mono text-sm flex-1">{block.text}</pre>

          {area === 'sortable' && (
            <span className="text-xs text-gray-400 ml-2">
              [{block.indentation}]
            </span>
          )}

          {block.groupId !== undefined && (
            <span className="text-xs px-2 py-1 bg-white rounded border ml-2">
              Group {block.groupId + 1}
            </span>
          )}
        </div>
      );
    },
    [
      currentProblem,
      draggedBlockId,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleSortableDropHandler,
      handleTrashDropHandler,
      createIndentationHandlers,
      createCombinedBlockIndentationHandler,
    ]
  );
  // ✅ Optimized empty drop zone handlers
  const handleEmptyDropZoneHandler = useCallback(
    (area: 'sortable' | 'trash') => (e: React.DragEvent) => {
      if (area === 'sortable') {
        handleDropToSortable(e);
      } else {
        handleDropToTrash(e);
      }
    },
    [handleDropToSortable, handleDropToTrash]
  );

  const renderDropZone = useCallback(
    (area: 'sortable' | 'trash', blocks: BlockItem[]) => {
      const isDropZoneActive = draggedItem !== null;
      const emptyDropHandler = handleEmptyDropZoneHandler(area);

      return (
        <div
          className={`space-y-2 min-h-32 transition-all duration-200 ${
            isDropZoneActive ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onDragOver={handleDragOver}
          onDrop={emptyDropHandler}
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
              onDrop={emptyDropHandler}
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
    },
    [draggedItem, handleDragOver, handleEmptyDropZoneHandler, renderBlock]
  );

  return (
    <div className="space-y-4">
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
      </div>{' '}
      {/* Integrated IndentationControls */}
      {currentProblem && sortableBlocks.length > 0 && (
        <IndentationControls className="mt-4" />
      )}
    </div>
  );
};

export default ParsonsBoard;
