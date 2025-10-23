import React from 'react';

/**
 * TAILWIND CSS TEXT CONTAINER - Wrap Mode
 * Natural text wrapping without truncation
 */
export const TailwindWrapContainer = ({ text, className = '' }) => {
  return (
    <div className={`
      max-w-sm px-4 py-3.5
      bg-white border-2 border-blue-300 rounded-xl shadow-lg
      font-serif text-xl font-semibold text-gray-800 text-center leading-snug
      whitespace-normal break-words hyphens-auto
      transition-all duration-300 hover:shadow-xl hover:border-blue-400
      ${className}
    `}>
      {text}
    </div>
  );
};

/**
 * ELLIPSIS MODE - Truncate with ...
 */
export const TailwindEllipsisContainer = ({ text, maxLines = 3 }) => {
  return (
    <div className={`
      max-w-sm px-4 py-3.5
      bg-white border-2 border-blue-300 rounded-xl shadow-lg
      font-serif text-xl font-semibold text-gray-800 text-center leading-snug
      overflow-hidden ${maxLines === 2 ? 'line-clamp-2' : 'line-clamp-3'}
      transition-all duration-300 hover:shadow-xl
    `}>
      {text}
    </div>
  );
};

/**
 * THEME VARIATIONS
 */
export const TailwindPurpleContainer = ({ text }) => (
  <div className="max-w-sm px-4 py-3.5 bg-gradient-to-br from-purple-50 to-purple-100 
    border-2 border-purple-400 rounded-xl shadow-lg font-serif text-xl font-semibold 
    text-purple-900 text-center leading-snug whitespace-normal break-words hyphens-auto 
    transition-all hover:shadow-xl">
    {text}
  </div>
);

export const TailwindGradientContainer = ({ text }) => (
  <div className="max-w-sm px-4 py-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 
    border-2 border-indigo-400 rounded-xl shadow-lg font-serif text-xl font-semibold 
    text-white text-center leading-snug whitespace-normal break-words 
    transition-all hover:shadow-xl hover:-translate-y-1">
    {text}
  </div>
);

export default TailwindWrapContainer;
