import React, { useRef, useEffect, useState } from 'react';
import './StyledTextContainer.css';

/**
 * StyledTextContainer - A flexible text box component with multiple display modes
 * 
 * @param {string} text - The text content to display
 * @param {string} mode - Display mode: 'wrap' | 'ellipsis' | 'auto-resize'
 * @param {number} maxLines - Maximum lines for ellipsis mode (default: 3)
 * @param {number} minFontSize - Minimum font size for auto-resize mode (default: 12)
 * @param {number} maxFontSize - Maximum font size for auto-resize mode (default: 20)
 * @param {string} className - Additional CSS classes
 */
const StyledTextContainer = ({ 
  text = 'Your text here',
  mode = 'wrap', // 'wrap' | 'ellipsis' | 'auto-resize'
  maxLines = 3,
  minFontSize = 12,
  maxFontSize = 20,
  className = '',
  style = {}
}) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  // Auto-resize font to fit content
  useEffect(() => {
    if (mode !== 'auto-resize' || !containerRef.current || !textRef.current) return;

    const adjustFontSize = () => {
      const container = containerRef.current;
      const textElement = textRef.current;
      
      let currentSize = maxFontSize;
      textElement.style.fontSize = `${currentSize}px`;

      // Reduce font size until text fits
      while (
        (textElement.scrollHeight > container.clientHeight ||
         textElement.scrollWidth > container.clientWidth) &&
        currentSize > minFontSize
      ) {
        currentSize -= 0.5;
        textElement.style.fontSize = `${currentSize}px`;
      }

      setFontSize(currentSize);
    };

    adjustFontSize();
    
    // Re-adjust on window resize
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [text, mode, minFontSize, maxFontSize]);

  const getModeClass = () => {
    switch (mode) {
      case 'ellipsis':
        return 'text-container--ellipsis';
      case 'auto-resize':
        return 'text-container--auto-resize';
      default:
        return 'text-container--wrap';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`styled-text-container ${getModeClass()} ${className}`}
      style={style}
    >
      <div 
        ref={textRef}
        className="text-container__content"
        style={{
          ...(mode === 'ellipsis' && {
            WebkitLineClamp: maxLines,
            lineClamp: maxLines
          }),
          ...(mode === 'auto-resize' && {
            fontSize: `${fontSize}px`
          })
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Example usage component
export const TextContainerExamples = () => {
  const shortText = "Beautiful subtitle";
  const mediumText = "This is a medium length subtitle that demonstrates text wrapping behavior";
  const longText = "This is a very long subtitle text that will demonstrate how the container handles extensive content. It includes multiple sentences to show wrapping, overflow handling, and responsive behavior across different screen sizes.";

  return (
    <div className="examples-container">
      <h2 className="examples-title">Styled Text Container Examples</h2>
      
      <div className="example-section">
        <h3 className="example-heading">Mode: Wrap (Default)</h3>
        <p className="example-description">Text wraps naturally onto multiple lines</p>
        
        <div className="example-grid">
          <div>
            <p className="example-label">Short text:</p>
            <StyledTextContainer text={shortText} mode="wrap" />
          </div>
          
          <div>
            <p className="example-label">Medium text:</p>
            <StyledTextContainer text={mediumText} mode="wrap" />
          </div>
          
          <div>
            <p className="example-label">Long text:</p>
            <StyledTextContainer text={longText} mode="wrap" />
          </div>
        </div>
      </div>

      <div className="example-section">
        <h3 className="example-heading">Mode: Ellipsis</h3>
        <p className="example-description">Text truncates with ellipsis after max lines</p>
        
        <div className="example-grid">
          <div>
            <p className="example-label">2 lines max:</p>
            <StyledTextContainer text={longText} mode="ellipsis" maxLines={2} />
          </div>
          
          <div>
            <p className="example-label">3 lines max:</p>
            <StyledTextContainer text={longText} mode="ellipsis" maxLines={3} />
          </div>
        </div>
      </div>

      <div className="example-section">
        <h3 className="example-heading">Mode: Auto-Resize</h3>
        <p className="example-description">Font size adjusts to fit all content</p>
        
        <div className="example-grid">
          <div>
            <p className="example-label">Short text (stays large):</p>
            <StyledTextContainer 
              text={shortText} 
              mode="auto-resize" 
              minFontSize={12}
              maxFontSize={24}
              style={{ height: '120px' }}
            />
          </div>
          
          <div>
            <p className="example-label">Long text (shrinks to fit):</p>
            <StyledTextContainer 
              text={longText} 
              mode="auto-resize" 
              minFontSize={10}
              maxFontSize={20}
              style={{ height: '120px' }}
            />
          </div>
        </div>
      </div>

      <div className="example-section">
        <h3 className="example-heading">Custom Styling</h3>
        <p className="example-description">Override default styles with custom props</p>
        
        <div className="example-grid">
          <StyledTextContainer 
            text={mediumText}
            mode="wrap"
            className="custom-purple"
            style={{ maxWidth: '18rem' }}
          />
          
          <StyledTextContainer 
            text={mediumText}
            mode="wrap"
            className="custom-gradient"
            style={{ maxWidth: '20rem' }}
          />
        </div>
      </div>
    </div>
  );
};

export default StyledTextContainer;
