/**
 * BlockArrangementExample.tsx
 * 
 * This component demonstrates how to work with block arrangements
 * using the actual BlockArrangement domain model
 */

import React, { useCallback, useState } from 'react';
import { ArrangedBlock, BlockArrangement, CodeBlock } from '@/types/domain';

interface BlockArrangementExampleProps {
  blocks: CodeBlock[];
}

const BlockArrangementExample: React.FC<BlockArrangementExampleProps> = ({ blocks }) => {
  // Initialize a block arrangement
  const initialArrangement: BlockArrangement = {
    blocks: [], // Empty to start
    timestamp: Date.now(),
    attemptNumber: 0
  };
  
  // State for the arrangement
  const [arrangement, setArrangement] = useState<BlockArrangement>(initialArrangement);
  
  // Track which blocks have been placed
  const [placedBlockIds, setPlacedBlockIds] = useState<Set<string>>(new Set());
  
  // Get unplaced blocks by filtering out blocks that are in the arrangement
  const getUnplacedBlocks = useCallback(() => {
    return blocks.filter(block => !placedBlockIds.has(block.id));
  }, [blocks, placedBlockIds]);
  
  // Add a block to the arrangement
  const addBlockToArrangement = useCallback((block: CodeBlock) => {
    const newArrangedBlock: ArrangedBlock = {
      blockId: block.id,
      position: arrangement.blocks.length, // Add to the end
      indentationLevel: 0, // Start with no indentation
      isInSolution: true // Assuming all placed blocks are part of the solution
    };
    
    // Update the arrangement
    setArrangement(prev => ({
      blocks: [...prev.blocks, newArrangedBlock],
      timestamp: Date.now(),
      attemptNumber: prev.attemptNumber
    }));
    
    // Mark this block as placed
    setPlacedBlockIds(prev => {
      const newSet = new Set(prev);
      newSet.add(block.id);
      return newSet;
    });
  }, [arrangement]);
  
  // Change indentation of a block in the arrangement
  const changeIndentation = useCallback((index: number, delta: number) => {
    setArrangement(prev => {
      const newBlocks = [...prev.blocks];
      const block = newBlocks[index];
      
      // Update indentation level (minimum 0)
      newBlocks[index] = {
        ...block,
        indentationLevel: Math.max(0, block.indentationLevel + delta)
      };
      
      return {
        ...prev,
        blocks: newBlocks,
        timestamp: Date.now()
      };
    });
  }, []);
  
  // Reset the arrangement
  const resetArrangement = useCallback(() => {
    setArrangement({
      blocks: [],
      timestamp: Date.now(),
      attemptNumber: arrangement.attemptNumber + 1
    });
    
    // Clear all placed blocks
    setPlacedBlockIds(new Set());
  }, [arrangement.attemptNumber]);
  
  // Get the original block content
  const getBlockContent = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    return block ? block.content : 'Unknown block';
  }, [blocks]);
  
  // Render the component
  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-4">Block Arrangement Example</h2>
      
      <div className="flex gap-4">
        {/* Unplaced blocks */}
        <div className="w-1/2">
          <h3 className="font-semibold mb-2">Available Blocks</h3>
          <div className="p-3 border rounded min-h-[200px] bg-gray-50">
            {getUnplacedBlocks().length === 0 ? (
              <p className="text-gray-400 text-center">All blocks placed</p>
            ) : (
              <div className="space-y-2">
                {getUnplacedBlocks().map(block => (
                  <div 
                    key={block.id}
                    onClick={() => addBlockToArrangement(block)}
                    className="p-2 bg-white border rounded cursor-pointer hover:bg-blue-50"
                  >
                    <pre className="font-mono text-sm whitespace-pre-wrap">{block.content}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Placed blocks (arrangement) */}
        <div className="w-1/2">
          <h3 className="font-semibold mb-2">Arrangement</h3>
          <div className="p-3 border rounded min-h-[200px] bg-gray-50">
            {arrangement.blocks.length === 0 ? (
              <p className="text-gray-400 text-center">No blocks arranged yet</p>
            ) : (
              <div className="space-y-2">
                {arrangement.blocks.map((arrangedBlock, index) => (
                  <div 
                    key={`${arrangedBlock.blockId}-${index}`}
                    className="flex items-center p-2 bg-white border rounded"
                  >
                    {/* Indentation controls */}
                    <div className="flex-shrink-0 mr-2">
                      <button 
                        onClick={() => changeIndentation(index, -1)}
                        disabled={arrangedBlock.indentationLevel === 0}
                        className="px-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        ◀
                      </button>
                      <button 
                        onClick={() => changeIndentation(index, 1)}
                        className="px-1 text-gray-500 hover:text-gray-700"
                      >
                        ▶
                      </button>
                    </div>
                    
                    {/* Block content with indentation */}
                    <pre className="flex-grow font-mono text-sm whitespace-pre-wrap">
                      {' '.repeat(arrangedBlock.indentationLevel * 2)}
                      {getBlockContent(arrangedBlock.blockId)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-4">
        <button 
          onClick={resetArrangement}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Reset Arrangement
        </button>
        
        {/* Debug information */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <h4 className="font-semibold mb-1">Current Arrangement:</h4>
          <p>Blocks: {arrangement.blocks.length}</p>
          <p>Attempt: {arrangement.attemptNumber}</p>
          <p>Last updated: {new Date(arrangement.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default BlockArrangementExample;
