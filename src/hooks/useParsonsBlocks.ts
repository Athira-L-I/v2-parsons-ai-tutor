import { useReducer, useCallback, useEffect } from 'react';

// Types (extract from existing BlockItem interface)
export interface BlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isCombined?: boolean;
  subLines?: string[];
  originalIndex?: number; // Adding this from the context interface
}

interface BoardState {
  sortableBlocks: BlockItem[];
  trashBlocks: BlockItem[];
}

// Action types
type BoardAction = 
  | { type: 'SET_INITIAL_BLOCKS'; sortableBlocks: BlockItem[]; trashBlocks: BlockItem[] }
  | { type: 'MOVE_BLOCK'; fromArea: 'sortable' | 'trash'; toArea: 'sortable' | 'trash'; fromIndex: number; toIndex?: number }
  | { type: 'CHANGE_INDENTATION'; blockId: string; indentation: number }
  | { type: 'UPDATE_BLOCKS'; sortableBlocks: BlockItem[]; trashBlocks?: BlockItem[] }
  | { type: 'RESET_BLOCKS' };

// Pure reducer function (no side effects)
function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_INITIAL_BLOCKS':
      return {
        sortableBlocks: action.sortableBlocks,
        trashBlocks: action.trashBlocks
      };

    case 'CHANGE_INDENTATION':
      return {
        ...state,
        sortableBlocks: state.sortableBlocks.map(block =>
          block.id === action.blockId 
            ? { ...block, indentation: action.indentation }
            : block
        )
      };

    case 'MOVE_BLOCK': {
      const { fromArea, toArea, fromIndex, toIndex } = action;
      
      if (fromArea === 'sortable' && toArea === 'trash') {
        const newSortableBlocks = [...state.sortableBlocks];
        const [movedBlock] = newSortableBlocks.splice(fromIndex, 1);
        
        return {
          sortableBlocks: newSortableBlocks,
          trashBlocks: [...state.trashBlocks, movedBlock]
        };
      }
      
      if (fromArea === 'trash' && toArea === 'sortable') {
        const newTrashBlocks = [...state.trashBlocks];
        const [movedBlock] = newTrashBlocks.splice(fromIndex, 1);
        const newSortableBlocks = [...state.sortableBlocks];
        
        const insertIndex = toIndex ?? newSortableBlocks.length;
        newSortableBlocks.splice(insertIndex, 0, movedBlock);
        
        return {
          sortableBlocks: newSortableBlocks,
          trashBlocks: newTrashBlocks
        };
      }
      
      if (fromArea === 'sortable' && toArea === 'sortable') {
        const newSortableBlocks = [...state.sortableBlocks];
        const [movedBlock] = newSortableBlocks.splice(fromIndex, 1);
        const insertIndex = toIndex ?? newSortableBlocks.length;
        newSortableBlocks.splice(insertIndex, 0, movedBlock);
        
        return {
          ...state,
          sortableBlocks: newSortableBlocks
        };
      }
      
      return state;
    }

    case 'UPDATE_BLOCKS':
      return {
        sortableBlocks: action.sortableBlocks,
        trashBlocks: action.trashBlocks ?? state.trashBlocks
      };

    case 'RESET_BLOCKS':
      return {
        sortableBlocks: [],
        trashBlocks: []
      };

    default:
      return state;
  }
}

// Custom hook
export function useParsonsBlocks(onSolutionChange?: (solution: string[], blocks: BlockItem[]) => void) {
  const [state, dispatch] = useReducer(boardReducer, {
    sortableBlocks: [],
    trashBlocks: []
  });

  // Generate solution from blocks (pure function)
  const generateSolution = useCallback((blocks: BlockItem[]): string[] => {
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

  // Side effect: notify parent of solution changes
  const notifySolutionChange = useCallback((blocks: BlockItem[]) => {
    if (onSolutionChange) {
      const solution = generateSolution(blocks);
      onSolutionChange(solution, blocks);
    }
  }, [generateSolution, onSolutionChange]);

  // Action creators
  const actions = {
    setInitialBlocks: useCallback((sortableBlocks: BlockItem[], trashBlocks: BlockItem[]) => {
      dispatch({ type: 'SET_INITIAL_BLOCKS', sortableBlocks, trashBlocks });
      notifySolutionChange(sortableBlocks);
    }, [notifySolutionChange]),

    changeIndentation: useCallback((blockId: string, indentation: number) => {
      dispatch({ type: 'CHANGE_INDENTATION', blockId, indentation });
      // The effect below will handle the notification
    }, []),

    moveBlock: useCallback((fromArea: 'sortable' | 'trash', toArea: 'sortable' | 'trash', fromIndex: number, toIndex?: number) => {
      dispatch({ type: 'MOVE_BLOCK', fromArea, toArea, fromIndex, toIndex });
      // The effect below will handle the notification
    }, []),

    updateBlocks: useCallback((sortableBlocks: BlockItem[], trashBlocks?: BlockItem[]) => {
      dispatch({ type: 'UPDATE_BLOCKS', sortableBlocks, trashBlocks });
      // The effect below will handle the notification
    }, []),

    resetBlocks: useCallback(() => {
      dispatch({ type: 'RESET_BLOCKS' });
      notifySolutionChange([]);
    }, [notifySolutionChange])
  };

  // Effect to handle solution change notifications after state updates
  useEffect(() => {
    notifySolutionChange(state.sortableBlocks);
  }, [state.sortableBlocks, notifySolutionChange]);

  return {
    sortableBlocks: state.sortableBlocks,
    trashBlocks: state.trashBlocks,
    actions
  };
}
