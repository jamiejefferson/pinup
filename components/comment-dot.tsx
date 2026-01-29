'use client';

interface CommentDotProps {
  number: number;
  position: { top: number; left: number };
  onClick: () => void;
  isHighlighted?: boolean;
}

/**
 * Numbered dot marker for comments on the prototype
 */
export function CommentDot({ 
  number, 
  position, 
  onClick, 
  isHighlighted = false 
}: CommentDotProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        absolute pointer-events-auto
        w-6 h-6 rounded-full
        flex items-center justify-center
        text-white text-xs font-bold
        border-2 border-white
        shadow-lg
        transition-transform duration-150
        hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent
        ${isHighlighted 
          ? 'bg-pink-400 scale-125' 
          : 'bg-pink-500'
        }
      `}
      style={{
        top: `${position.top}%`,
        left: `${position.left}%`,
        transform: 'translate(-50%, -50%)',
      }}
      aria-label={`Comment ${number}`}
    >
      {number}
    </button>
  );
}
