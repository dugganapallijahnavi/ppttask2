import React, { useState, useRef, useEffect } from 'react';
import './Toolbar.css';

const insertOptions = [
  { key: 'addText', label: 'Text' },
  { key: 'addImage', label: 'Image' },
  { key: 'addChart', label: 'Chart' },
  { key: 'addShape', label: 'Shape' }
];

const Toolbar = ({
  onInsertSelect,
  onPreview,
  onSavePpt,
  backgroundOptions = [],
  selectedBackground = '#050505',
  onSelectBackground,
  themeOptions = [],
  selectedThemeId = null,
  onSelectTheme
}) => {
  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const insertRef = useRef(null);
  const backgroundRef = useRef(null);
  const themeRef = useRef(null);

  const handleToggle = (menu) => {
    if (menu === 'insert') {
      setIsInsertOpen(!isInsertOpen);
      setIsBackgroundOpen(false);
      setIsThemeOpen(false);
    } else if (menu === 'background') {
      setIsBackgroundOpen(!isBackgroundOpen);
      setIsInsertOpen(false);
      setIsThemeOpen(false);
    } else if (menu === 'theme') {
      setIsThemeOpen(!isThemeOpen);
      setIsInsertOpen(false);
      setIsBackgroundOpen(false);
    }
  };

  const handleSaveClick = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await onSavePpt();
    } catch (error) {
      console.error('Failed to save:', error);
    }
    setIsDownloading(false);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-group" ref={insertRef}>
          <button
            type="button"
            className={`toolbar-button ${isInsertOpen ? 'active' : ''}`}
            onClick={() => handleToggle('insert')}
          >
            Insert
          </button>
          {isInsertOpen && (
            <div className="dropdown-menu">
              {insertOptions.map(option => (
                <button
                  key={option.key}
                  type="button"
                  className="dropdown-item"
                  onClick={() => onInsertSelect(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-group" ref={themeRef}>
          <button
            type="button"
            className={`toolbar-button ${isThemeOpen ? 'active' : ''}`}
            onClick={() => handleToggle('theme')}
          >
            Themes
          </button>
          {isThemeOpen && themeOptions.length > 0 && (
            <div className="dropdown-menu">
              {themeOptions.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  className={`dropdown-item ${selectedThemeId === theme.id ? 'active' : ''}`}
                  onClick={() => onSelectTheme(theme.id)}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-group" ref={backgroundRef}>
          <button
            type="button"
            className={`toolbar-button ${isBackgroundOpen ? 'active' : ''}`}
            onClick={() => handleToggle('background')}
          >
            Background
          </button>
          {isBackgroundOpen && (
            <div className="dropdown-menu">
              {backgroundOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`dropdown-item ${selectedBackground === color ? 'active' : ''}`}
                  onClick={() => onSelectBackground(color)}
                >
                  <span className="color-preview" style={{ backgroundColor: color }} />
                  {color}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-right">
        <button 
          type="button" 
          className="toolbar-button primary"
          onClick={onPreview}
        >
          Presentation
        </button>
        <button
          type="button"
          className="toolbar-button secondary"
          onClick={handleSaveClick}
          disabled={isDownloading}
        >
          {isDownloading ? 'Saving…' : 'Save PPTX'}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;