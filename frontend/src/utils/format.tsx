import React, { ReactNode } from 'react';

/**
 * Safely formats message text by handling bold (**text**) and newlines.
 * This is a lightweight alternative to a full markdown library.
 */
export function formatMessage(text: string): ReactNode[] {
  if (!text) return [];

  // Split by newlines first to handle paragraphs
  const paragraphs = text.split('\n');
  
  return paragraphs.map((paragraph, pIdx) => {
    // Process bold text within each paragraph
    const parts = paragraph.split(/(\*\*.*?\*\*)/g);
    
    const formattedParagraph = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the asterisks and wrap in <strong>
        return <strong key={`${pIdx}-${i}`} className="font-extrabold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Wrap the paragraph in a div with some bottom margin
    return (
      <div key={pIdx} className={pIdx < paragraphs.length - 1 ? "mb-2" : ""}>
        {formattedParagraph}
      </div>
    );
  });
}