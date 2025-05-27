import React, { useState, useMemo } from 'react';
import { NextPage } from 'next';
import { useParsonsContext, BlockItem } from '@/contexts/ParsonsContext';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const sampleProblem: ParsonsSettings = {
  initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    average = total / count
    return average
print("Debug info") #distractor
result = None #distractor`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 2,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
  },
};

const BlockDisplay: React.FC<{
  block: BlockItem;
  onSelect: (blockId: string) => void;
  isSelected: boolean;
}> = ({ block, onSelect, isSelected }) => {
  return (
    <div
      onClick={() => onSelect(block.id)}
      className={`p-3 mb-2 rounded border-2 cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : block.groupColor || 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-sm">
          {block.isCombined
            ? `[Combined: ${block.subLines?.length} lines]`
            : block.text}
        </span>
        {block.isCombined && (
          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
            Combined
          </span>
        )}
      </div>

      {block.isCombined && block.subLines && (
        <div className="mt-2 pl-2 border-l-2 border-gray-300">
          {block.subLines.map((line, index) => (
            <div key={index} className="font-mono text-xs text-gray-600 mb-1">
              <pre className="whitespace-pre">{line}</pre>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-600 space-y-1">
        <div>ID: {block.id}</div>
        <div>Is Combined: {block.isCombined ? 'Yes' : 'No'}</div>
        <div>Is Distractor: {block.isDistractor ? 'Yes' : 'No'}</div>
        <div>Indentation: {block.indentation}</div>
        {block.groupId !== undefined && <div>Group ID: {block.groupId}</div>}
      </div>
    </div>
  );
};

const TestCombinedHook: NextPage = () => {
  const {
    settings,
    blocks,
    solution,
    trash,
    updateSettings,
    cleanup,
    createCombinedBlock,
    splitCombinedBlock,
    applyCombineBlocksAdaptation,
  } = useParsonsContext();

  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [targetArea, setTargetArea] = useState<'blocks' | 'solution' | 'trash'>(
    'solution'
  );

  // Memoized statistics to ensure they update properly
  const statistics = useMemo(() => {
    const allBlocks = [...blocks, ...solution, ...trash];
    const combinedBlocks = allBlocks.filter((block) => block.isCombined);
    const individualBlocks = allBlocks.filter((block) => !block.isCombined);

    return {
      totalBlocks: allBlocks.length,
      combinedBlocks: combinedBlocks.length,
      individualBlocks: individualBlocks.length,
      selectedBlocks: selectedBlocks.length,
      totalLines: allBlocks.reduce((sum, block) => {
        if (block.isCombined && block.subLines) {
          return sum + block.subLines.length;
        }
        return sum + 1;
      }, 0),
    };
  }, [blocks, solution, trash, selectedBlocks.length]);

  const handleLoadProblem = () => {
    updateSettings(sampleProblem);
    setSelectedBlocks([]);
  };

  const handleReset = () => {
    cleanup();
    setSelectedBlocks([]);
  };

  const handleBlockSelect = (blockId: string) => {
    setSelectedBlocks((prev) => {
      if (prev.includes(blockId)) {
        return prev.filter((id) => id !== blockId);
      } else {
        return [...prev, blockId];
      }
    });
  };

  const handleCombineSelected = () => {
    if (selectedBlocks.length < 2) {
      alert('Please select at least 2 blocks to combine');
      return;
    }

    createCombinedBlock(selectedBlocks, targetArea);
    setSelectedBlocks([]);
  };

  const handleSplitBlock = (blockId: string) => {
    splitCombinedBlock(blockId);
  };

  const handleApplyAdaptation = () => {
    if (!settings) {
      alert('No problem loaded');
      return;
    }
    applyCombineBlocksAdaptation();
    setSelectedBlocks([]);
  };

  const allBlocks = [...blocks, ...solution, ...trash];
  const combinedBlocks = allBlocks.filter((block) => block.isCombined);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Test Combined Block Hook Support
      </h1>

      <div className="mb-6 space-x-4">
        <button
          onClick={handleLoadProblem}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Load Problem
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset
        </button>
        <button
          onClick={handleApplyAdaptation}
          disabled={!settings}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          Apply Combine Adaptation
        </button>
      </div>

      {!settings && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p>Click "Load Problem" to test the combined block functionality.</p>
        </div>
      )}

      {settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Block Selection */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              Select Blocks to Combine
            </h2>

            <div className="mb-4">
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-sm font-medium">Target Area:</span>
                <select
                  value={targetArea}
                  onChange={(e) =>
                    setTargetArea(
                      e.target.value as 'blocks' | 'solution' | 'trash'
                    )
                  }
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="blocks">Blocks</option>
                  <option value="solution">Solution</option>
                  <option value="trash">Trash</option>
                </select>
              </div>

              <button
                onClick={handleCombineSelected}
                disabled={selectedBlocks.length < 2}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Combine Selected ({selectedBlocks.length})
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <h3 className="font-medium mb-2">
                All Blocks ({statistics.totalBlocks}):
              </h3>
              {allBlocks.map((block) => (
                <BlockDisplay
                  key={block.id}
                  block={block}
                  onSelect={handleBlockSelect}
                  isSelected={selectedBlocks.includes(block.id)}
                />
              ))}
            </div>
          </div>

          {/* Combined Blocks Management */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              Combined Blocks ({statistics.combinedBlocks})
            </h2>

            <div className="max-h-96 overflow-y-auto">
              {combinedBlocks.length === 0 ? (
                <div className="text-gray-500 italic">
                  No combined blocks yet
                </div>
              ) : (
                combinedBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="mb-4 p-3 border rounded bg-orange-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        Combined Block ({block.subLines?.length} lines)
                      </span>
                      <button
                        onClick={() => handleSplitBlock(block.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Split
                      </button>
                    </div>

                    <div className="space-y-1">
                      {block.subLines?.map((line, index) => (
                        <div
                          key={index}
                          className="font-mono text-sm bg-white p-1 rounded"
                        >
                          <pre className="whitespace-pre">{line}</pre>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-gray-600 mt-2">
                      ID: {block.id} | Lines: {block.subLines?.length} | Indent:{' '}
                      {block.indentation}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Updated Statistics */}
      {settings && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Live Statistics:</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Blocks:</span>{' '}
              {statistics.totalBlocks}
            </div>
            <div>
              <span className="font-medium">Combined Blocks:</span>{' '}
              {statistics.combinedBlocks}
            </div>
            <div>
              <span className="font-medium">Individual Blocks:</span>{' '}
              {statistics.individualBlocks}
            </div>
            <div>
              <span className="font-medium">Selected Blocks:</span>{' '}
              {statistics.selectedBlocks}
            </div>
            <div>
              <span className="font-medium">Total Code Lines:</span>{' '}
              {statistics.totalLines}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to Test:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Load Problem" to load blocks with proper indentation</li>
          <li>Select 2+ blocks by clicking them (they'll highlight blue)</li>
          <li>
            Click "Combine Selected" - statistics should update immediately
          </li>
          <li>Click "Apply Combine Adaptation" to see automatic combination</li>
          <li>Use "Split" buttons to break combined blocks apart</li>
          <li>Notice indentation is preserved in combined blocks</li>
        </ol>
      </div>
    </div>
  );
};

export default TestCombinedHook;
