import { useDrop } from 'react-dnd';

const ItemTypes = {
  CODE_BLOCK: 'CODE_BLOCK',
};

const EmptyDropTarget = ({ area, onDrop }) => {
  const [, drop] = useDrop({
    accept: ItemTypes.CODE_BLOCK,
    drop: (item) => {
      onDrop(item);
    },
  });

  return (
    <div
      ref={drop}
      className="h-16 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded bg-gray-50"
    >
      Drop blocks here
    </div>
  );
};

export default EmptyDropTarget;
