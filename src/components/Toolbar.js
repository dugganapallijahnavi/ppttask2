import React, { useState, useRef, useEffect } from 'react';
import './Toolbar.css';

const Toolbar = ({
  onInsertSelect,
  onPreview,
  onSavePpt,
  backgroundOptions = [],
  selectedBackground = '#050505',
  onSelectBackground,
  themeOptions = [],
  selectedThemeId = null,
  onSelectTheme,
  onUndo,
  onRedo,
  fileName = 'task1',
  onFileNameChange
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
        {/* Insert Buttons */}
        <button
          type="button"
          className="toolbar-button icon-button"
          onClick={() => onInsertSelect('addText')}
          title="Add Text"
        >
          <span className="button-icon">T</span>
          <span className="button-label">Text</span>
        </button>
        
        <button
          type="button"
          className="toolbar-button icon-button"
          onClick={() => onInsertSelect('addImage')}
          title="Add Image"
        >
          <span className="button-icon">🖼</span>
          <span className="button-label">Image</span>
        </button>
        
        <button
          type="button"
          className="toolbar-button icon-button"
          onClick={() => onInsertSelect('addShape')}
          title="Add Shape"
        >
          <span className="button-icon">◇</span>
          <span className="button-label">Shapes</span>
        </button>
        
        <button
          type="button"
          className="toolbar-button icon-button"
          onClick={() => onInsertSelect('addChart')}
          title="Add Chart"
        >
          <span className="button-icon">📊</span>
          <span className="button-label">Charts</span>
        </button>

        <button
          type="button"
          className="toolbar-button icon-button"
          onClick={() => onInsertSelect('addTable')}
          title="Add Table"
        >
          <span className="button-icon">⊞</span>
          <span className="button-label">Table</span>
        </button>

        {/* Divider */}
        <div className="toolbar-divider"></div>

        {/* Undo/Redo */}
        <button
          type="button"
          className="toolbar-button icon-only"
          onClick={onUndo}
          title="Undo"
        >
          <span className="button-icon">←</span>
          <span className="button-label">Undo</span>
        </button>
        
        <button
          type="button"
          className="toolbar-button icon-only"
          onClick={onRedo}
          title="Redo"
        >
          <span className="button-icon">→</span>
          <span className="button-label">Redo</span>
        </button>
      </div>

      <div className="toolbar-center">
        <input
          type="text"
          className="file-name-input"
          value={fileName}
          onChange={(e) => onFileNameChange && onFileNameChange(e.target.value)}
          placeholder="Enter file name"
        />
      </div>

      <div className="toolbar-right">
        <button
          type="button"
          className="toolbar-button save-button"
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