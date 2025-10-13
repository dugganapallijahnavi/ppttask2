import React, { useEffect, useRef, useState } from 'react';
import './EnhancedToolbar.css';

const INSERT_OPTIONS = [
  { key: 'text', label: 'Text', icon: 'TXT', description: 'Add a text box' },
  { key: 'image', label: 'Image', icon: 'IMG', description: 'Insert an image from your device' },
  { key: 'shape', label: 'Shape', icon: 'SHP', description: 'Draw basic shapes and lines' },
  { key: 'chart', label: 'Chart', icon: 'CHT', description: 'Visualize data with charts' }
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
  onBackgroundChange,
  onThemeChange,
  onSavePresentation,
  onStartSlideshow,
  currentBackground,
  currentTheme,
  themes = [],
  backgroundColors = [],
  keepInsertEnabled = false,
  onToggleKeepInsert
}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [chartMenuOpen, setChartMenuOpen] = useState(false);
  const [shapeMenuTop, setShapeMenuTop] = useState(0);
  const [chartMenuTop, setChartMenuTop] = useState(0);

  const insertMenuRef = useRef(null);
  const shapeMenuRef = useRef(null);
  const chartMenuRef = useRef(null);
  const designMenuRef = useRef(null);
  const backgroundMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const nodes = [
        insertMenuRef.current,
        shapeMenuRef.current,
        chartMenuRef.current,
        designMenuRef.current,
        backgroundMenuRef.current
      ];

      const clickedInside = nodes.some(
        (node) => node && node.contains && node.contains(event.target)
      );

      if (!clickedInside) {
        setOpenMenu(null);
        setShapeMenuOpen(false);
        setChartMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenus = () => {
    setOpenMenu(null);
    setShapeMenuOpen(false);
    setChartMenuOpen(false);
  };

  const handleInsert = (type, subtype = null, event = null) => {
    if (type === 'shape' && !subtype) {
      setChartMenuOpen(false);
      setShapeMenuOpen((prev) => {
        const next = !prev;
        if (next) {
          if (event?.currentTarget && insertMenuRef.current) {
            const buttonRect = event.currentTarget.getBoundingClientRect();
            const menuRect = insertMenuRef.current.getBoundingClientRect();
            setShapeMenuTop(buttonRect.top - menuRect.top);
          } else {
            setShapeMenuTop(0);
          }
        }
        return next;
      });
      return;
    }

    if (type === 'chart' && !subtype) {
      setShapeMenuOpen(false);
      setChartMenuOpen((prev) => {
        const next = !prev;
        if (next) {
          if (event?.currentTarget && insertMenuRef.current) {
            const buttonRect = event.currentTarget.getBoundingClientRect();
            const menuRect = insertMenuRef.current.getBoundingClientRect();
            setChartMenuTop(buttonRect.top - menuRect.top);
          } else {
            setChartMenuTop(0);
          }
        }
        return next;
      });
      return;
    }

    onInsertElement?.(type, subtype);
    closeMenus();
  };

  const renderInsertMenu = () => (
    <div className="dropdown-menu" ref={insertMenuRef}>
      {INSERT_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          className="dropdown-item"
          onClick={(event) => handleInsert(option.key, null, event)}
        >
          <span className="dropdown-icon">{option.icon}</span>
          <div className="dropdown-copy">
            <span className="dropdown-title">{option.label}</span>
            <span className="dropdown-description">{option.description}</span>
          </div>
          {(option.key === 'shape' || option.key === 'chart') && (
            <span className="dropdown-chevron">&gt;</span>
          )}
        </button>
      ))}
      {shapeMenuOpen && (
        <div
          className="shape-menu"
          ref={shapeMenuRef}
          style={{ top: shapeMenuTop }}
        >
          {SHAPE_OPTIONS.map((shape) => (
            <button
              key={shape.key}
              type="button"
              className="dropdown-item"
              onClick={() => handleInsert('shape', shape.key)}
            >
              {shape.label}
            </button>
          ))}
        </div>
      )}
      {chartMenuOpen && (
        <div
          className="chart-menu"
          ref={chartMenuRef}
          style={{ top: chartMenuTop }}
        >
          {CHART_OPTIONS.map((chart) => (
            <button
              key={chart.key}
              type="button"
              className="dropdown-item"
              onClick={() => handleInsert('chart', chart.key)}
            >
              <div className="chart-menu-copy">
                <span className="dropdown-title">{chart.label}</span>
                <span className="dropdown-description">{chart.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <label className="dropdown-toggle-row">
        <input
          type="checkbox"
          checked={keepInsertEnabled}
          onChange={(event) => onToggleKeepInsert?.(event.target.checked)}
        />
        Keep inserting
      </label>
    </div>
  );

  const renderDesignMenu = () => (
    <div className="dropdown-menu theme-menu" ref={designMenuRef}>
      <div className="theme-tabs">
        
      </div>
      <div className="theme-list">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => {
              onThemeChange?.(theme.id);
              closeMenus();
            }}
          >
            <span className="theme-preview">
              <span
                className="theme-preview-chip"
                style={{ backgroundColor: theme.colors.background || '#111111' }}
              >
                <span
                  className="theme-preview-accent"
                  style={{ backgroundColor: theme.colors.accent || theme.colors.primary }}
                />
                <span
                  className="theme-preview-text"
                  style={{ color: theme.colors.secondary || '#ffffff' }}
                >
                  Aa
                </span>
              </span>
            </span>
            <span className="theme-name">{theme.name}</span>
          </button>
        ))}
      </div>
      <div className="theme-footer">
        
       
      </div>
    </div>
  );

  const renderBackgroundMenu = () => (
    <div className="dropdown-menu background-menu" ref={backgroundMenuRef}>
      <div className="color-grid">
        {backgroundColors.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-option ${currentBackground === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => {
              onBackgroundChange?.(color);
              closeMenus();
            }}
            title={color}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="enhanced-toolbar">
      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-button ${openMenu === 'insert' ? 'active' : ''}`}
          onClick={() => {
            setShapeMenuOpen(false);
            setOpenMenu((prev) => (prev === 'insert' ? null : 'insert'));
          }}
        >
          <span className="button-icon"></span>
          Insert
        </button>
        {openMenu === 'insert' && renderInsertMenu()}
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-button ${openMenu === 'design' ? 'active' : ''}`}
          onClick={() => {
            setShapeMenuOpen(false);
            setOpenMenu((prev) => (prev === 'design' ? null : 'design'));
          }}
        >
          <span className="button-icon"></span>
          Theme
        </button>
        {openMenu === 'design' && renderDesignMenu()}
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-button ${openMenu === 'background' ? 'active' : ''}`}
          onClick={() => {
            setShapeMenuOpen(false);
            setOpenMenu((prev) => (prev === 'background' ? null : 'background'));
          }}
        >
          <span className="button-icon"></span>
          Background
        </button>
        {openMenu === 'background' && renderBackgroundMenu()}
      </div>

      <div className="toolbar-group toolbar-group-actions">
        <button type="button" className="toolbar-button primary" onClick={() => onStartSlideshow?.()}>
          <span className="button-icon"></span>
          Presentation
        </button>
        <button type="button" className="toolbar-button secondary" onClick={() => onSavePresentation?.()}>
          <span className="button-icon"></span>
          Save PPTX
        </button>
      </div>
    </div>
  );
};

export default EnhancedToolbar;





