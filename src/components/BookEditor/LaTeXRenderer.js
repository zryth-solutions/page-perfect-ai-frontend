/**
 * LaTeXRenderer Component
 * Renders text with LaTeX math expressions
 */

import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

const LaTeXRenderer = ({ text, inline = true }) => {
  if (!text) return null;

  // Clean up common LaTeX formatting issues
  const cleanLaTeX = (latex) => {
    let cleaned = latex;
    
    // Fix spacing issues in \text{} commands
    // Example: "\text {m a r k s}" -> "\text{marks}"
    cleaned = cleaned.replace(/\\text\s*\{([^}]+)\}/g, (match, content) => {
      // Remove extra spaces between letters
      const cleanedContent = content.replace(/\s+/g, ' ').trim();
      return `\\text{${cleanedContent}}`;
    });
    
    // Fix spacing issues in other commands
    cleaned = cleaned.replace(/\\\s+/g, '\\');
    
    // Fix double backslashes with spaces
    cleaned = cleaned.replace(/\\\\\s+/g, '\\\\ ');
    
    return cleaned;
  };

  // Parse text and identify LaTeX expressions
  const parseContent = (content) => {
    const parts = [];
    let currentIndex = 0;
    
    // Regex patterns for different LaTeX delimiters
    const patterns = [
      { regex: /\$\$(.*?)\$\$/gs, display: true },  // Display math: $$...$$
      { regex: /\$(.*?)\$/g, display: false },       // Inline math: $...$
      { regex: /\\begin\{array\}(.*?)\\end\{array\}/gs, display: true }, // Arrays
      { regex: /\\left\((.*?)\\right\)/gs, display: false }, // Parentheses
      { regex: /\\text\s*\{[^}]+\}/g, display: false }, // Text commands
      { regex: /\\[a-zA-Z]+\s*\{[^}]*\}/g, display: false } // Other commands
    ];

    // Find all LaTeX expressions
    const matches = [];
    patterns.forEach(({ regex, display }) => {
      const re = new RegExp(regex);
      let match;
      while ((match = re.exec(content)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          display
        });
      }
    });

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep the first one)
    const filteredMatches = [];
    let lastEnd = -1;
    matches.forEach(match => {
      if (match.start >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.end;
      }
    });

    // Build parts array
    filteredMatches.forEach((match, index) => {
      // Add text before LaTeX
      if (match.start > currentIndex) {
        const textBefore = content.substring(currentIndex, match.start);
        if (textBefore.trim()) {
          parts.push({ type: 'text', content: textBefore });
        }
      }

      // Add LaTeX
      parts.push({
        type: 'latex',
        content: match.text,
        display: match.display
      });

      currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < content.length) {
      const textAfter = content.substring(currentIndex);
      if (textAfter.trim()) {
        parts.push({ type: 'text', content: textAfter });
      }
    }

    // If no LaTeX found, return the whole text
    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }

    return parts;
  };

  // Render a single LaTeX expression
  const renderLaTeX = (latex, display = false) => {
    try {
      // Clean the LaTeX
      let cleanedLaTeX = cleanLaTeX(latex);
      
      // Remove outer delimiters
      cleanedLaTeX = cleanedLaTeX
        .replace(/^\$\$/, '')
        .replace(/\$\$$/, '')
        .replace(/^\$/, '')
        .replace(/\$$/, '');

      // Render with KaTeX
      const html = katex.renderToString(cleanedLaTeX, {
        throwOnError: false,
        displayMode: display,
        output: 'html',
        strict: false,
        trust: true
      });

      return (
        <span
          className={display ? 'latex-display' : 'latex-inline'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      // Return original text if rendering fails
      return <span className="latex-error">{latex}</span>;
    }
  };

  // Parse and render the content
  const parts = parseContent(text);

  return (
    <span className="latex-content">
      {parts.map((part, index) => {
        if (part.type === 'latex') {
          return <React.Fragment key={index}>{renderLaTeX(part.content, part.display)}</React.Fragment>;
        } else {
          return <span key={index}>{part.content}</span>;
        }
      })}
    </span>
  );
};

export default LaTeXRenderer;

