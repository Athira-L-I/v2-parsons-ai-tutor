import React, { useEffect, useState } from 'react';
import { useParsonsContext } from '@/contexts/ParsonsContext';

interface BlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
}

const ParsonsBoard: React.FC = () => {
  const { 
    currentProblem, 
    userSolution, 
    setUserSolution,
    isCorrect
  } = useParsonsContext();
  
  const [sortableBlocks, setSortableBlocks] = useState<BlockItem[]>([]);
  const [trashBlocks, setTrashBlocks] = useState<BlockItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<BlockItem | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Initialize blocks from the current problem
  useEffect(() => {
    if (!currentProblem) return;

    // Only run on the client
    const lines = currentProblem.initial.split('\n').filter(line => line.trim());
    const initialBlocks = lines.map((line, index) => {
      const isDistractor = line.includes('#distractor');
      const cleanLine = isDistractor ? line.replace(/#distractor\s*$/, '') : line;
      return {
        id: `block-${index}`,
        text: cleanLine.trimStart(),
        indentation: 0,
        isDistractor
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
  
  // Update the solution in the context
  const updateSolution = (blocks: BlockItem[]) => {
    const solution = blocks.map(block => {
      const indent = '    '.repeat(block.indentation);
      return `${indent}${block.text}`;
    });
    
    setUserSolution(solution);
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, area: 'sortable' | 'trash', block: BlockItem, index: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      area,
      block,
      index
    }));
    
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
          // Dropped on a specific position
          newSortableBlocks.splice(dropIndex, 0, draggedBlock);
        } else {
          // Dropped in empty area
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
      console.error("Error handling drop:", error);
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
          // Dropped on a specific position
          newTrashBlocks.splice(dropIndex, 0, draggedBlock);
        } else {
          // Dropped in empty area
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
      console.error("Error handling drop:", error);
    }
  };
  
  const changeIndentation = (index: number, newIndent: number) => {
    if (!currentProblem?.options.can_indent) return;
    
    const updatedBlocks = [...sortableBlocks];
    updatedBlocks[index] = { ...updatedBlocks[index], indentation: newIndent };
    
    setSortableBlocks(updatedBlocks);
    updateSolution(updatedBlocks);
  };
  
  /*
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null; // or a loading spinner
  */
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
            {trashBlocks.map((block, index) => (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, 'trash', block, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDropToTrash(e, index);
                }}
                className="flex items-center p-2 bg-white rounded shadow cursor-move border border-gray-200"
              >
                <pre className="font-mono text-sm flex-1">{block.text}</pre>
              </div>
            ))}
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
          isCorrect === true ? 'border-green-300' : isCorrect === false ? 'border-red-300' : 'border-gray-300'
        }`}
      >
        <h3 className="text-lg font-semibold mb-2">Your Solution</h3>
        <div 
          className="space-y-2 min-h-32"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropToSortable(e)}
        >
          {sortableBlocks.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, 'sortable', block, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                handleDropToSortable(e, index);
              }}
              className="flex items-center p-2 bg-white rounded shadow cursor-move border border-gray-200"
              style={{ paddingLeft: `${(block.indentation * (currentProblem?.options.x_indent || 50) / 16) + 8}px` }}
            >
              {currentProblem?.options.can_indent !== false && (
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
                      block.indentation === 0 ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => changeIndentation(index, block.indentation + 1)}
                    className="px-2 py-0.5 text-xs bg-gray-300 hover:bg-gray-400 rounded"
                  >
                    →
                  </button>
                </div>
              )}
              <pre className="font-mono text-sm flex-1">{block.text}</pre>
            </div>
          ))}
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
