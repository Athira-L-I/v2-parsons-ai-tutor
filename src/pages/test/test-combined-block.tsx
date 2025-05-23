import React, { useState } from 'react';
import { NextPage } from 'next';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CombinedBlock from '@/components/CombinedBlock';
import { useDrop } from 'react-dnd';

const EmptyDropTarget: React.FC<{
  area: 'sortable' | 'trash';
  onDrop: (item: any) => void;
}> = ({ area, onDrop }) => {
  const [, drop] = useDrop({
    accept: 'COMBINED_BLOCK',
    drop: (item: any) => {
      // You may want to pass correct indices/areas here
      onDrop(item);
    },
  });

  return (
    <div
      ref={drop}
      className="h-24 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded bg-gray-50"
      style={{ minHeight: '64px' }}
    >
      {area === 'sortable'
        ? 'Drop combined blocks here'
        : 'No blocks in trash (drop here)'}
    </div>
  );
};

const TestCombinedBlock: NextPage = () => {
  const [blocks, setBlocks] = useState([
    {
      id: 'combined-1',
      lines: [
        'def calculate_average(numbers):',
        '    if not numbers:',
        '        return 0',
      ],
      indentation: 0,
      area: 'sortable' as const,
      groupColor: 'border-purple-200 bg-purple-50',
      groupId: 0,
    },
    {
      id: 'combined-2',
      lines: [
        'total = sum(numbers)',
        'count = len(numbers)',
        'return total / count',
      ],
      indentation: 1,
      area: 'sortable' as const,
      groupColor: 'border-indigo-200 bg-indigo-50',
      groupId: 1,
    },
    {
      id: 'combined-3',
      lines: ['print("Starting calculation")', 'print("Processing data")'],
      indentation: 0,
      area: 'trash' as const,
      groupColor: undefined,
      groupId: undefined,
    },
  ]);

  const [canIndent, setCanIndent] = useState(true);
  const [indentSize, setIndentSize] = useState(50);

  const moveBlock = (
    dragIndex: number,
    hoverIndex: number,
    sourceArea: 'sortable' | 'trash',
    targetArea: 'sortable' | 'trash'
  ) => {
    console.log(
      `Moving block from index ${dragIndex} to ${hoverIndex}, from ${sourceArea} to ${targetArea}`
    );

    // Simple reordering for demo purposes
    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[dragIndex];

    // Update area if moved between areas
    if (sourceArea !== targetArea) {
      draggedBlock.area = targetArea;
    }

    // Reorder
    newBlocks.splice(dragIndex, 1);
    newBlocks.splice(hoverIndex, 0, draggedBlock);

    setBlocks(newBlocks);
  };

  const changeIndentation = (index: number, newIndent: number) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], indentation: newIndent };
    setBlocks(newBlocks);
  };

  const sortableBlocks = blocks.filter((block) => block.area === 'sortable');
  const trashBlocks = blocks.filter((block) => block.area === 'trash');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">
          Test Combined Block Component
        </h1>

        {/* Controls */}
        <div className="mb-6 bg-white p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Controls</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={canIndent}
                onChange={(e) => setCanIndent(e.target.checked)}
                className="mr-2"
              />
              Enable Indentation
            </label>
            <label className="flex items-center">
              <span className="mr-2">Indent Size:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={indentSize}
                onChange={(e) => setIndentSize(parseInt(e.target.value))}
                className="mr-2"
              />
              <span>{indentSize}px</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sortable Area */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Solution Area</h2>
            <div className="space-y-4 min-h-64 border-2 border-dashed border-gray-300 p-4 rounded">
              {sortableBlocks.map((block, index) => (
                <CombinedBlock
                  key={block.id}
                  id={block.id}
                  index={index}
                  lines={block.lines}
                  indentation={block.indentation}
                  area="sortable"
                  moveBlock={moveBlock}
                  changeIndentation={changeIndentation}
                  canIndent={canIndent}
                  indentSize={indentSize}
                  groupColor={block.groupColor}
                  groupId={block.groupId}
                />
              ))}
              {sortableBlocks.length === 0 && (
                <EmptyDropTarget
                  area="sortable"
                  onDrop={(item) => {
                    // Find the block's index in the blocks array by id
                    const dragIndex = blocks.findIndex((b) => b.id === item.id);
                    if (dragIndex !== -1) {
                      moveBlock(dragIndex, 0, item.area, 'sortable');
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Trash Area */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Available Blocks</h2>
            <div className="space-y-4 min-h-64 border-2 border-dashed border-gray-300 p-4 rounded">
              {trashBlocks.map((block, index) => (
                <CombinedBlock
                  key={block.id}
                  id={block.id}
                  index={sortableBlocks.length + index} // Offset by sortable blocks
                  lines={block.lines}
                  indentation={block.indentation}
                  area="trash"
                  moveBlock={moveBlock}
                  changeIndentation={changeIndentation}
                  canIndent={canIndent}
                  indentSize={indentSize}
                  groupColor={block.groupColor}
                  groupId={block.groupId}
                />
              ))}
              {trashBlocks.length === 0 && (
                <EmptyDropTarget
                  area="trash"
                  onDrop={(item) => {
                    const dragIndex = blocks.findIndex((b) => b.id === item.id);
                    if (dragIndex !== -1) {
                      moveBlock(dragIndex, 0, item.area, 'trash');
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Block State Display */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current Block State:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(blocks, null, 2)}
          </pre>
        </div>

        <div className="mt-6 bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
          <ul className="text-sm space-y-1">
            <li>• Multi-line code blocks with visual separators</li>
            <li>• Drag and drop between sortable and trash areas</li>
            <li>• Indentation controls (left/right arrows)</li>
            <li>• Group identification with colored borders</li>
            <li>• Combined block visual indicators</li>
            <li>• Proper spacing and typography for code</li>
          </ul>
        </div>
      </div>
    </DndProvider>
  );
};

export default TestCombinedBlock;
