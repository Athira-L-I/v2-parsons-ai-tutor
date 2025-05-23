import React, { useState } from 'react';
import { NextPage } from 'next';
import { useParsonsWidget, BlockItem } from '@/hooks/useParsonsWidget';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const sampleProblemWithGroups: ParsonsSettings = {
  initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    return total / count
    if not nums: #distractor
    if numbers: #distractor
    total = sum(nums) #distractor
    return total / len(numbers) #distractor
    count = length(numbers) #distractor
    print("Error") #distractor`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 6,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
  },
};

const BlockDisplay: React.FC<{ block: BlockItem }> = ({ block }) => {
  return (
    <div
      className={`p-3 mb-2 rounded border-2 ${
        block.groupColor || 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-sm">{block.text}</span>
        {block.groupId !== undefined && (
          <span className="text-xs px-2 py-1 bg-white rounded border">
            Group {block.groupId + 1}
          </span>
        )}
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        <div>ID: {block.id}</div>
        <div>Original Index: {block.originalIndex}</div>
        <div>Is Distractor: {block.isDistractor ? 'Yes' : 'No'}</div>
        <div>
          Is Paired Distractor: {block.isPairedDistractor ? 'Yes' : 'No'}
        </div>
        {block.groupId !== undefined && <div>Group ID: {block.groupId}</div>}
      </div>
    </div>
  );
};

const TestBlockGroups: NextPage = () => {
  const { settings, blocks, solution, trash, updateSettings, cleanup } =
    useParsonsWidget();

  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const handleLoadProblem = () => {
    updateSettings(sampleProblemWithGroups);
  };

  const handleReset = () => {
    cleanup();
  };

  const allBlocks = [...blocks, ...solution, ...trash];
  const groupedBlocks = allBlocks.reduce((groups, block) => {
    const groupId = block.groupId ?? -1;
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    groups[groupId].push(block);
    return groups;
  }, {} as Record<number, BlockItem[]>);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Test Block Group Identification
      </h1>

      <div className="mb-6 space-x-4">
        <button
          onClick={handleLoadProblem}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Load Problem with Groups
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset
        </button>
        <button
          onClick={() => setShowGroupInfo(!showGroupInfo)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {showGroupInfo ? 'Hide' : 'Show'} Group Info
        </button>
      </div>

      {!settings && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p>
            Click "Load Problem with Groups" to test the group identification
            feature.
          </p>
        </div>
      )}

      {settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* All Blocks Display */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              All Blocks ({allBlocks.length})
            </h2>
            <div className="max-h-96 overflow-y-auto">
              {allBlocks.map((block) => (
                <BlockDisplay key={block.id} block={block} />
              ))}
            </div>
          </div>

          {/* Grouped View */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Blocks by Group</h2>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {Object.entries(groupedBlocks).map(([groupId, blocksInGroup]) => (
                <div key={groupId} className="border rounded p-3">
                  <h3 className="font-medium mb-2">
                    {groupId === '-1'
                      ? 'No Group'
                      : `Group ${parseInt(groupId) + 1}`}
                    <span className="text-sm text-gray-500 ml-2">
                      ({blocksInGroup.length} blocks)
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {blocksInGroup.map((block) => (
                      <div
                        key={block.id}
                        className={`p-2 rounded text-sm ${
                          block.groupColor || 'bg-gray-100'
                        }`}
                      >
                        <div className="font-mono">{block.text}</div>
                        {showGroupInfo && (
                          <div className="text-xs text-gray-600 mt-1">
                            Paired: {block.isPairedDistractor ? 'Yes' : 'No'} |
                            Distractor: {block.isDistractor ? 'Yes' : 'No'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {settings && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Group Statistics:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Blocks:</span>{' '}
              {allBlocks.length}
            </div>
            <div>
              <span className="font-medium">Groups Found:</span>{' '}
              {Object.keys(groupedBlocks).filter((id) => id !== '-1').length}
            </div>
            <div>
              <span className="font-medium">Paired Distractors:</span>{' '}
              {allBlocks.filter((b) => b.isPairedDistractor).length}
            </div>
            <div>
              <span className="font-medium">Ungrouped Blocks:</span>{' '}
              {groupedBlocks[-1]?.length || 0}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Expected Groups:</h3>
        <ul className="text-sm space-y-1">
          <li>
            • Group 1: "if not numbers:" and "if not nums:" (variable name
            change)
          </li>
          <li>
            • Group 2: "total = sum(numbers)" and "total = sum(nums)" (variable
            name change)
          </li>
          <li>
            • Group 3: "return total / count" and "return total / len(numbers)"
            (function name change)
          </li>
          <li>
            • Ungrouped: "count = length(numbers)" and "print('Error')"
            (standalone distractors)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TestBlockGroups;
