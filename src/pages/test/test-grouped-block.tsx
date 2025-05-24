import React, { useState } from 'react';
import { NextPage } from 'next';
import GroupedBlock from '@/components/GroupedBlock';

interface TestBlock {
  id: string;
  text: string;
  indentation: number;
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isDistractor?: boolean;
}

const sampleBlocks: TestBlock[] = [
  {
    id: 'block-1',
    text: 'def calculate_average(numbers):',
    indentation: 0,
    groupId: 0,
    groupColor: 'border-purple-200 bg-purple-50',
    isPairedDistractor: false,
    isDistractor: false,
  },
  {
    id: 'block-2',
    text: 'if not numbers:',
    indentation: 1,
    groupId: 1,
    groupColor: 'border-indigo-200 bg-indigo-50',
    isPairedDistractor: false,
    isDistractor: false,
  },
  {
    id: 'block-3',
    text: 'if not nums:',
    indentation: 1,
    groupId: 1,
    groupColor: 'border-indigo-200 bg-indigo-50',
    isPairedDistractor: true,
    isDistractor: true,
  },
  {
    id: 'block-4',
    text: 'total = sum(numbers)',
    indentation: 1,
    groupId: 2,
    groupColor: 'border-pink-200 bg-pink-50',
    isPairedDistractor: false,
    isDistractor: false,
  },
  {
    id: 'block-5',
    text: 'total = sum(nums)',
    indentation: 1,
    groupId: 2,
    groupColor: 'border-pink-200 bg-pink-50',
    isPairedDistractor: true,
    isDistractor: true,
  },
  {
    id: 'block-6',
    text: 'return average',
    indentation: 1,
    isDistractor: true,
  },
  {
    id: 'block-7',
    text: 'print("Done")',
    indentation: 0,
  },
];

const TestGroupedBlock: NextPage = () => {
  const [blocks, setBlocks] = useState<TestBlock[]>(sampleBlocks);

  const handleDragStart = (
    e: React.DragEvent,
    area: string,
    block: any,
    index: number
  ) => {
    console.log('Drag started:', { area, block: block.id, index });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag ended');
  };

  const moveBlock = (
    dragIndex: number,
    hoverIndex: number,
    sourceArea: string,
    targetArea: string
  ) => {
    console.log('Move block:', {
      dragIndex,
      hoverIndex,
      sourceArea,
      targetArea,
    });
  };

  const changeIndentation = (index: number, newIndent: number) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], indentation: newIndent };
    setBlocks(newBlocks);
    console.log(`Changed indentation for block ${index} to ${newIndent}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Grouped Block Component</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grouped Blocks Demo */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Grouped Blocks</h2>
          <div className="space-y-2">
            {blocks.map((block, index) => (
              <GroupedBlock
                key={block.id}
                id={block.id}
                index={index}
                text={block.text}
                indentation={block.indentation}
                area="sortable"
                moveBlock={moveBlock}
                changeIndentation={changeIndentation}
                canIndent={true}
                indentSize={50}
                groupId={block.groupId}
                groupColor={block.groupColor}
                isPairedDistractor={block.isPairedDistractor}
                isDistractor={block.isDistractor}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>

        {/* Legend and Features */}
        <div className="space-y-4">
          {/* Group Colors Legend */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3">Group Colors</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-purple-200 bg-purple-50 rounded"></div>
                <span className="text-sm">Purple - Group 1</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-indigo-200 bg-indigo-50 rounded"></div>
                <span className="text-sm">Indigo - Group 2</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-pink-200 bg-pink-50 rounded"></div>
                <span className="text-sm">Pink - Group 3</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-red-200 bg-red-50 rounded"></div>
                <span className="text-sm">Red - Ungrouped Distractor</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-200 bg-white rounded"></div>
                <span className="text-sm">Gray - Ungrouped Solution</span>
              </div>
            </div>
          </div>

          {/* Status Indicators Legend */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3">Status Indicators</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-white rounded border border-gray-300 font-medium">
                  G1
                </span>
                <span className="text-sm">Group Number</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded border border-orange-300">
                  Alt
                </span>
                <span className="text-sm">Paired Distractor (Alternative)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded border border-red-300">
                  ❌
                </span>
                <span className="text-sm">General Distractor</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Features to Test</h3>
            <ul className="text-sm space-y-1">
              <li>
                • <strong>Group Colors:</strong> Blocks in same group have
                matching colors
              </li>
              <li>
                • <strong>Group Badges:</strong> Show group membership (G1, G2,
                etc.)
              </li>
              <li>
                • <strong>Drag & Drop:</strong> All blocks are draggable
              </li>
              <li>
                • <strong>Indentation:</strong> Use ← → buttons to adjust
                indentation
              </li>
              <li>
                • <strong>Status Indicators:</strong> Show distractor type
              </li>
              <li>
                • <strong>Visual Consistency:</strong> Grouped blocks have
                cohesive styling
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Try dragging blocks around - check console for drag events</li>
          <li>Use indentation buttons (← →) to change block indentation</li>
          <li>Observe that blocks in the same group have matching colors</li>
          <li>Check that group badges (G1, G2) are displayed correctly</li>
          <li>
            Verify that distractor indicators (Alt, ❌) appear appropriately
          </li>
          <li>Confirm hover effects and visual feedback work properly</li>
        </ol>
      </div>
    </div>
  );
};

export default TestGroupedBlock;
