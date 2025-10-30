import React, { useEffect, useRef, useState } from 'react';
import './EnhancedToolbar.css';
import TableGridSelector from './TableGridSelector';

const INSERT_OPTIONS = [
  { key: 'text', label: 'TEXT' },
  { key: 'image', label: 'IMAGE' },
  { key: 'shape', label: 'SHAPES' },
  { key: 'chart', label: 'CHARTS' },
  { key: 'table', label: 'TABLE' }
];

const SHAPE_OPTIONS = [
  { key: 'rectangle', label: 'Rectangle' },
  { key: 'circle', label: 'Circle' },
  { key: 'triangle', label: 'Triangle' },
  { key: 'arrow', label: 'Arrow' },
  { key: 'star', label: 'Star' }
];

const CHART_OPTIONS = [
    { key: 'bar', label: 'Bar', description: 'Horizontal bars for ranking data' },
    { key: 'area', label: 'Area', description: 'Filled line chart for totals' },
  { key: 'pie', label: 'Pie', description: 'Show parts of a whole' },
  { key: 'columnLine', label: 'Column + Line', description: 'Combine columns with a trend line' }
];

const EnhancedToolbar = ({
  onInsertElement,
  onSavePresentation,
  onStartSlideshow,
  keepInsertEnabled = false,
  onToggleKeepInsert,
  fileName = 'untitled',
  onFileNameChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const [activePanel, setActivePanel] = useState(null);
  const panelRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const toolbarNode = toolbarRef.current;
      const panelNode = panelRef.current;
      if (
        toolbarNode &&
        panelNode &&
        !toolbarNode.contains(event.target) &&
        !panelNode.contains(event.target)
      ) {
        setActivePanel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrimaryInsert = (type) => {
    if (type === 'shape' || type === 'chart' || type === 'table') {
      setActivePanel((prev) => (prev === type ? null : type));
      return;
    }

    onInsertElement?.(type);
  };

  const handlePanelInsert = (type, subtype) => {
    onInsertElement?.(type, subtype);
    if (!keepInsertEnabled) {
      setActivePanel(null);
    }
  };

  const handleTableSelect = (rows, cols) => {
    onInsertElement?.('table', null, { rows, cols });
    if (!keepInsertEnabled) {
      setActivePanel(null);
    }
  };

  const renderPanelContent = () => {
    if (activePanel === 'shape') {
      return (
        <>
          <span className="panel-title">Shapes</span>
          {SHAPE_OPTIONS.map((shape) => (
            <button
              key={shape.key}
              type="button"
              className="panel-option"
              onClick={() => handlePanelInsert('shape', shape.key)}
            >
              {shape.label}
            </button>
          ))}
        </>
      );
    }

    if (activePanel === 'chart') {
      return (
        <>
          <span className="panel-title">Charts</span>
          {CHART_OPTIONS.map((chart) => (
            <button
              key={chart.key}
              type="button"
              className="panel-option"
              onClick={() => handlePanelInsert('chart', chart.key)}
            >
              <span className="panel-option-label">{chart.label}</span>
              <span className="panel-option-help">{chart.description}</span>
            </button>
          ))}
        </>
      );
    }

    if (activePanel === 'table') {
      return (
        <TableGridSelector
          onSelect={handleTableSelect}
          onClose={() => setActivePanel(null)}
        />
      );
    }

    return null;
  };

  const getButtonIcon = (key) => {
    switch (key) {
      case 'text':
        return 'T';
      case 'image':
        return '🖼';
      case 'shape':
        return '◇';
      case 'chart':
        return '📊';
      case 'table':
        return '⊞';
      default:
        return '';
    }
  };

  return (
    <div className="enhanced-toolbar" ref={toolbarRef}>
      <div className="toolbar-left">
        {INSERT_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`toolbar-button icon-button ${activePanel === option.key ? 'active' : ''}`}
            onClick={() => handlePrimaryInsert(option.key)}
          >
            <span className="button-icon">{getButtonIcon(option.key)}</span>
            <span className="button-text">{option.label.charAt(0) + option.label.slice(1).toLowerCase()}</span>
          </button>
        ))}
        
        <div className="toolbar-divider" />
        
        <button
          type="button"
          className="toolbar-button undo-redo-button"
          onClick={() => onUndo?.()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <span className="button-icon">←</span>
          <span className="button-text">Undo</span>
        </button>
        
        <button
          type="button"
          className="toolbar-button undo-redo-button"
          onClick={() => onRedo?.()}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <span className="button-icon">→</span>
          <span className="button-text">Redo</span>
        </button>

        {activePanel && (
          <div className="toolbar-panel" ref={panelRef}>
            <div className="panel-options">{renderPanelContent()}</div>
          </div>
        )}
      </div>

      <div className="toolbar-right">
        <input
          type="text"
          className="filename-input"
          placeholder="Enter filename"
          value={fileName}
          onChange={(e) => onFileNameChange?.(e.target.value)}
          maxLength={50}
        />
        <button type="button" className="toolbar-button presentation-button" onClick={() => onStartSlideshow?.()}>
          <span className="button-text">Presentation</span>
        </button>
        <button type="button" className="toolbar-button save-button" onClick={() => onSavePresentation?.()}>
          <span className="button-text">Save PPTX</span>
        </button>
      </div>
    </div>
  );
};

export default EnhancedToolbar;





