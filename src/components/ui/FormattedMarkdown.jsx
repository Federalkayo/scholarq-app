import React from 'react';

/**
 * FormattedMarkdown renders markdown text cleanly, converting **bold**, *italics*,
 * bullet points (* / -), and headings (### / ##) into formatted React elements,
 * eliminating raw asterisks (**) or hashes (###).
 */
export default function FormattedMarkdown({ content, className = '' }) {
  if (!content) return null;

  const renderInline = (text) => {
    if (!text) return null;

    // Regex to capture **bold** or *italic*
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} class="font-bold text-on-surface">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
        return (
          <em key={i} class="italic text-on-surface-variant">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={index} class="h-1.5" />);
      return;
    }

    // Headings #, ##, ###, ####, etc.
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const headingText = headingMatch[2];
      elements.push(
        <h4 key={index} class="font-bold text-[14px] text-primary mt-sm mb-xs">
          {renderInline(headingText)}
        </h4>
      );
      return;
    }

    // Bullet points * or - or •
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
      elements.push(
        <div key={index} class="flex items-start gap-2 my-1 pl-1">
          <span class="text-primary text-[14px] leading-snug select-none font-bold">•</span>
          <div class="flex-1 leading-relaxed">{renderInline(bulletText)}</div>
        </div>
      );
      return;
    }

    // Standard paragraph line
    elements.push(
      <p key={index} class="my-0.5 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });

  return <div class={`space-y-0.5 text-body-md ${className}`}>{elements}</div>;
}
