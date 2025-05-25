import React, { useState } from 'react';
import { ParsonsProvider } from '@/contexts/ParsonsContext';
import IndentationControls from '@/components/IndentationControls';
import { ParsonsSettings } from '@/@types/types';

interface BlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
  originalIndex: number;
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isCombined?: boolean;
  subLines?: string[];
}

const TestIndentationControlsPage: React.FC = () => {
  const [indentationMode, setIndentationMode] = useState<'manual' | 'provided'>(
    'manual'
  );

  // Sample settings for both modes
  const manualSettings: ParsonsSettings = {
    initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
print("Hello World") #distractor`,
    options: {
      can_indent: true,
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 2,
    },
  };

  const providedSettings: ParsonsSettings = {
    initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
print("Hello World") #distractor`,
    options: {
      can_indent: false, // Indentation provided
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 2,
    },
  };

  // Sample solution blocks with different indentation levels
  const [currentSolution, setCurrentSolution] = useState<BlockItem[]>([
    {
      id: 'block-1',
      text: 'def calculate_average(numbers):',
      indentation: 0,
      originalIndex: 0,
    },
    {
      id: 'block-2',
      text: 'if not numbers:',
      indentation: 2, // Intentionally wrong indentation
      originalIndex: 1,
    },
    {
      id: 'block-3',
      text: 'return 0',
      indentation: 0, // Intentionally wrong indentation
      originalIndex: 2,
    },
    {
      id: 'block-4',
      text: 'total = sum(numbers)',
      indentation: 1,
      originalIndex: 3,
    },
    {
      id: 'block-5',
      text: 'return total / len(numbers)',
      indentation: 1,
      originalIndex: 4,
    },
    {
      id: 'combined-block',
      text: '2 combined lines',
      indentation: 1, // This controls the base indentation for the combined block
      originalIndex: 5,
      isCombined: true,
      subLines: [
        'if not numbers:', // Will be indented based on block.indentation
        '    return 0', // Will be indented based on block.indentation + its own relative indent
      ],
    },
  ]);

  const handleChangeIndentation = (blockId: string, newIndent: number) => {
    console.log('Changing indentation for block:', blockId, 'to:', newIndent);
    setCurrentSolution((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, indentation: newIndent } : block
      )
    );
  };

  const handleApplyHint = (blockId: string, lineIndex: number) => {
    console.log('Applying hint for block:', blockId, 'at line:', lineIndex);

    // Generate the current and expected solution lines
    const currentSolutionLines: string[] = [];
    const lineToBlockMapping: { blockId: string; subLineIndex?: number }[] = [];

    currentSolution.forEach((block) => {
      const blockIndent = '    '.repeat(block.indentation);
      if (block.isCombined && block.subLines) {
        block.subLines.forEach((subLine, subIndex) => {
          const trimmedSubLine = subLine.trim();
          const subLineIndent = subLine.match(/^(\s*)/)?.[1] || '';
          const additionalIndent = Math.floor(subLineIndent.length / 4);
          const totalIndent = '    '.repeat(
            block.indentation + additionalIndent
          );
          currentSolutionLines.push(`${totalIndent}${trimmedSubLine}`);
          lineToBlockMapping.push({
            blockId: block.id,
            subLineIndex: subIndex,
          });
        });
      } else {
        currentSolutionLines.push(`${blockIndent}${block.text}`);
        lineToBlockMapping.push({ blockId: block.id });
      }
    });

    const expectedSolutionLines = providedSettings.initial
      .split('\n')
      .filter((line) => line.trim() && !line.includes('#distractor'));

    // Calculate expected indentation for this line
    if (
      lineIndex < expectedSolutionLines.length &&
      lineIndex < lineToBlockMapping.length
    ) {
      const expectedLine = expectedSolutionLines[lineIndex];
      const expectedIndent = Math.floor(
        (expectedLine.match(/^(\s*)/)?.[1].length || 0) / 4
      );

      const mapping = lineToBlockMapping[lineIndex];
      const targetBlock = currentSolution.find((b) => b.id === mapping.blockId);

      if (targetBlock) {
        if (targetBlock.isCombined && mapping.subLineIndex !== undefined) {
          // For combined blocks, we need to adjust the entire block's indentation
          // based on the expected indentation of this specific subLine
          const subLine = targetBlock.subLines?.[mapping.subLineIndex];
          if (subLine) {
            const subLineRelativeIndent = Math.floor(
              (subLine.match(/^(\s*)/)?.[1].length || 0) / 4
            );
            const newBlockIndent = Math.max(
              0,
              expectedIndent - subLineRelativeIndent
            );

            setCurrentSolution((prev) =>
              prev.map((b) =>
                b.id === targetBlock.id
                  ? { ...b, indentation: newBlockIndent }
                  : b
              )
            );
            console.log(
              `Applied hint: Set combined block ${targetBlock.id} base indentation to ${newBlockIndent}`
            );
          }
        } else {
          // For regular blocks, set the indentation directly
          setCurrentSolution((prev) =>
            prev.map((b) =>
              b.id === targetBlock.id
                ? { ...b, indentation: expectedIndent }
                : b
            )
          );
          console.log(
            `Applied hint: Set block ${targetBlock.id} indentation to ${expectedIndent}`
          );
        }
      }
    }
  };

  const settings =
    indentationMode === 'manual' ? manualSettings : providedSettings;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Test: Indentation Controls Component
          </h1>
          <p className="text-gray-600 mb-4">
            Test the IndentationControls component in both manual and provided
            modes.
          </p>

          {/* Mode Toggle */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="font-medium text-gray-700">Mode:</span>
            <button
              onClick={() => setIndentationMode('manual')}
              className={`px-4 py-2 rounded ${
                indentationMode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Manual Controls
            </button>
            <button
              onClick={() => setIndentationMode('provided')}
              className={`px-4 py-2 rounded ${
                indentationMode === 'provided'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Indentation Provided
            </button>
          </div>

          {/* Current Settings Display */}
          <div className="bg-white p-4 rounded border mb-6">
            <h3 className="font-semibold mb-2">Current Settings:</h3>
            <p className="text-sm text-gray-600">
              can_indent:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {String(settings.options.can_indent)}
              </code>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Mode:{' '}
              <strong>
                {indentationMode === 'manual'
                  ? 'Manual Controls'
                  : 'Indentation Helper'}
              </strong>
            </p>
          </div>
        </div>

        {/* Current Solution Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-3">Current Solution Blocks:</h3>
            <div className="space-y-2">
              {currentSolution.map((block) => (
                <div
                  key={block.id}
                  className="text-sm font-mono bg-gray-100 p-2 rounded"
                >
                  <div className="flex justify-between">
                    <span>{block.text}</span>
                    <span className="text-blue-600">
                      Indent: {block.indentation}
                    </span>
                  </div>
                  {block.isCombined && block.subLines && (
                    <div className="text-xs text-gray-500 mt-1">
                      <div>
                        Combined block with {block.subLines.length} lines:
                      </div>
                      {block.subLines.map((subLine, i) => {
                        const subLineIndent =
                          subLine.match(/^(\s*)/)?.[1] || '';
                        const additionalIndent = Math.floor(
                          subLineIndent.length / 4
                        );
                        const totalIndent =
                          block.indentation + additionalIndent;
                        return (
                          <div key={i} className="ml-2 font-mono text-xs">
                            {'  '.repeat(totalIndent)}└─ {subLine.trim()}{' '}
                            (indent: {totalIndent})
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* IndentationControls Component */}
          <div>
            <IndentationControls
              settings={settings}
              currentSolution={currentSolution}
              onChangeIndentation={handleChangeIndentation}
              onApplyHint={handleApplyHint}
            />
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p className="text-sm">
            Open browser console to see indentation change events
          </p>
          <p className="text-sm">
            Total blocks in solution: {currentSolution.length}
          </p>
          <p className="text-sm">
            Current indentations:{' '}
            {currentSolution.map((b) => `${b.id}:${b.indentation}`).join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestIndentationControlsPage;
