import React, { useState } from 'react';
import { NextPage } from 'next';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const sampleSettingsWithPairedDistractors: ParsonsSettings = {
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
    count = length(numbers) #distractor`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 5,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
  },
};

const TestContent: React.FC = () => {
  const {
    settings,
    blocks,
    solution,
    trash,
    adaptationMessage,
    updateSettings,
    moveBlock,
    cleanup,
  } = useParsonsContext();

  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  const handleLoadSettings = () => {
    updateSettings(sampleSettingsWithPairedDistractors);
  };

  const handleReset = () => {
    cleanup();
    setSelectedBlockId('');
  };

  const handleMoveToSolution = (blockId: string) => {
    const block = trash.find((b) => b.id === blockId);
    if (block) {
      moveBlock(blockId, 'trash', 'solution');
    }
  };

  const handleMoveToTrash = (blockId: string) => {
    const block = solution.find((b) => b.id === blockId);
    if (block) {
      moveBlock(blockId, 'solution', 'trash');
    }
  };

  const allBlocks = [...blocks, ...solution, ...trash];
  const groupedBlocks = allBlocks.filter(
    (block) => block.groupId !== undefined
  );
  const groups = Array.from(
    new Set(groupedBlocks.map((block) => block.groupId))
  )
    .filter((id) => id !== undefined)
    .map((groupId) => ({
      id: groupId!,
      blocks: groupedBlocks.filter((block) => block.groupId === groupId),
    }));

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Paired Distractor Logic</h1>

      <div className="mb-6 space-x-4">
        <button
          onClick={handleLoadSettings}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Load Paired Distractors
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Adaptation Messages */}
      {adaptationMessage && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded border border-blue-300">
          {adaptationMessage}
        </div>
      )}

      {!settings && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
          <p>Click "Load Paired Distractors" to test the one-per-group rule.</p>
        </div>
      )}

      {settings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trash Area */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              Available Blocks ({trash.length})
            </h2>
            <div className="space-y-2">
              {trash.map((block) => (
                <div
                  key={block.id}
                  className={`p-3 rounded border-2 cursor-pointer transition-colors ${
                    block.groupColor || 'border-gray-200'
                  } ${
                    selectedBlockId === block.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm">{block.text}</div>
                    <div className="flex items-center space-x-2">
                      {block.groupId !== undefined && (
                        <span className="text-xs px-2 py-1 bg-white rounded border">
                          G{block.groupId + 1}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToSolution(block.id);
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Area */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              Solution ({solution.length})
            </h2>
            <div className="space-y-2">
              {solution.map((block) => (
                <div
                  key={block.id}
                  className={`p-3 rounded border-2 cursor-pointer transition-colors ${
                    block.groupColor || 'border-gray-200'
                  } ${
                    selectedBlockId === block.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm">{block.text}</div>
                    <div className="flex items-center space-x-2">
                      {block.groupId !== undefined && (
                        <span className="text-xs px-2 py-1 bg-white rounded border">
                          G{block.groupId + 1}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToTrash(block.id);
                        }}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        ←
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {solution.length === 0 && (
                <div className="p-4 text-gray-500 border border-dashed rounded">
                  Drop blocks here to build your solution
                </div>
              )}
            </div>
          </div>

          {/* Group Analysis */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Group Analysis</h2>
            <div className="space-y-3">
              {groups.map((group) => {
                const solutionBlock = group.blocks.find((block) =>
                  solution.some((s) => s.id === block.id)
                );
                const trashBlocks = group.blocks.filter((block) =>
                  trash.some((t) => t.id === block.id)
                );

                return (
                  <div key={group.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Group {group.id + 1}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          solutionBlock
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {solutionBlock ? 'In Solution' : 'Not in Solution'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      {solutionBlock && (
                        <div className="text-green-700">
                          ✓ {solutionBlock.text}
                        </div>
                      )}
                      {trashBlocks.map((block) => (
                        <div key={block.id} className="text-gray-600">
                          • {block.text} {block.isPairedDistractor && '(Alt)'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Testing Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Load the paired distractors problem</li>
          <li>
            Try moving multiple blocks from the same group to the solution area
          </li>
          <li>Observe that only one block per group is allowed in solution</li>
          <li>
            When you move a second block from the same group, the first one
            should be automatically moved back to trash
          </li>
          <li>
            Check that conflicting blocks are placed adjacent to their group
            members in trash
          </li>
          <li>
            Look for the blue notification message explaining the conflict
            resolution
          </li>
        </ol>
      </div>

      {/* Expected Behavior */}
      <div className="mt-4 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Expected Behavior:</h3>
        <ul className="text-sm space-y-1">
          <li>
            • <strong>One-per-group rule:</strong> Only one block from each
            group allowed in solution
          </li>
          <li>
            • <strong>Automatic conflict resolution:</strong> Moving a second
            group member displaces the first
          </li>
          <li>
            • <strong>Smart placement:</strong> Conflicting blocks placed near
            group members in trash
          </li>
          <li>
            • <strong>User feedback:</strong> Clear messages about what happened
            and why
          </li>
          <li>
            • <strong>Group consistency:</strong> All group members maintain
            same visual styling
          </li>
        </ul>
      </div>

      {/* Group Status Summary */}
      {settings && (
        <div className="mt-4 bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current Group Status:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {groups.map((group) => {
              const solutionBlock = group.blocks.find((block) =>
                solution.some((s) => s.id === block.id)
              );
              return (
                <div key={group.id} className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded ${
                      group.blocks[0]?.groupColor
                        ?.replace('border-', 'bg-')
                        .replace('bg-50', 'bg-200') || 'bg-gray-300'
                    }`}
                  ></div>
                  <span>
                    Group {group.id + 1}: {solutionBlock ? '✓' : '○'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const TestPairedDistractorLogic: NextPage = () => {
  return <TestContent />;
};

export default TestPairedDistractorLogic;
