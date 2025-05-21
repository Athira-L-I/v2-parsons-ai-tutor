import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CodeBlock from '@/components/CodeBlock';

export default function TestCodeBlock() {
  const [blocks, setBlocks] = useState([
    { id: 'block-1', text: 'def hello_world():', indentation: 0 },
    { id: 'block-2', text: '    print("Hello, World!")', indentation: 1 },
    { id: 'block-3', text: '    return None', indentation: 1 },
    { id: 'block-4', text: 'hello_world()', indentation: 0 },
  ]);

  const moveBlock = (dragIndex: number, hoverIndex: number, sourceArea: 'sortable' | 'trash', targetArea: 'sortable' | 'trash') => {
    const draggedBlock = blocks[dragIndex];
    
    // Create new array without the dragged block
    const newBlocks = blocks.filter((_, i) => i !== dragIndex);
    
    // Insert the block at the new position
    newBlocks.splice(hoverIndex, 0, draggedBlock);
    
    // Update state
    setBlocks(newBlocks);
  };

  const changeIndentation = (index: number, newIndent: number) => {
    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      indentation: newIndent
    };
    setBlocks(newBlocks);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">CodeBlock Component Test</h1>
        
        <div className="border-2 border-gray-300 rounded p-4 mb-8">
          <h2 className="text-lg font-semibold mb-4">Sortable Area</h2>
          <div className="space-y-2">
            {blocks.map((block, index) => (
              <CodeBlock
                key={block.id}
                id={block.id}
                index={index}
                text={block.text}
                indentation={block.indentation}
                area="sortable"
                moveBlock={moveBlock}
                changeIndentation={changeIndentation}
                canIndent={true}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Current State:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(blocks, null, 2)}
          </pre>
        </div>
      </div>
    </DndProvider>
  );
}
