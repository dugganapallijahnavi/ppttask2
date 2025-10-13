import React, { useEffect, useRef, useState } from 'react';
import './Toolbar.css';

const insertOptions = [
  { key: 'addText', label: 'Add text', icon: 'T' },
  { key: 'addImage', label: 'Add image', icon: 'IMG' },
  { key: 'addChart', label: 'Add chart', icon: 'CR' },
  { key: 'addShape', label: 'Add shapes', icon: 'SH' }
];

const Toolbar = ({
  activeTab,
  setActiveTab,
  onInsertSelect,
  onPreview,
  onSavePpt,
  onSaveJson,
  onOpenJson,
  backgroundOptions = [],
  selectedBackground = '#050505',
  onSelectBackground,
  themeOptions = [],
  selectedThemeId = null,
  onSelectTheme
}) => {
  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const insertRef = useRef(null);
  const filesRef = useRef(null);
  const backgroundRef = useRef(null);
  const themeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (insertRef.current && !insertRef.current.contains(event.target)) {
        setIsInsertOpen(false);
      }
      if (filesRef.current && !filesRef.current.contains(event.target)) {
        setIsFilesOpen(false);
      }
      if (isBackgroundOpen && backgroundRef.current && !backgroundRef.current.contains(event.target)) {
        setIsBackgroundOpen(false);
        if (typeof setActiveTab === 'function') {
          setActiveTab('home');
        }
      }
      if (isThemeOpen && themeRef.current && !themeRef.current.contains(event.target)) {
        setIsThemeOpen(false);
        if (typeof setActiveTab === 'function') {
          setActiveTab('home');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBackgroundOpen, isThemeOpen, setActiveTab]);

  const handleTabSelect = (tabKey) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tabKey);
    }
    if (tabKey !== 'insert') {
      setIsInsertOpen(false);
    }
    setIsFilesOpen(false);
    setIsBackgroundOpen(false);
    setIsThemeOpen(false);
  };

  const handleInsertClick = () => {
    handleTabSelect('insert');
    setIsInsertOpen((prev) => !prev);
    setIsFilesOpen(false);
    setIsBackgroundOpen(false);
    setIsThemeOpen(false);
  };

  const handleInsertOption = (option) => {
    if (typeof onInsertSelect === 'function') {
      onInsertSelect(option.key);
    }
    setIsInsertOpen(false);
  };

  const handleFilesClick = () => {
    setIsFilesOpen((prev) => !prev);
    setIsInsertOpen(false);
    setIsBackgroundOpen(false);
    setIsThemeOpen(false);
    if (!isFilesOpen && typeof setActiveTab === 'function') {
      setActiveTab('home');
    }
  };

  const runAndNotify = async (fn, successMessage, failureMessage) => {
    try {
      const result = await (fn?.() ?? Promise.resolve({ status: 'success' }));
      if (result?.status === 'error') {
        window.alert(result?.message || failureMessage);
      } else {
        window.alert(successMessage);
      }
    } catch (error) {
      window.alert(error?.message || failureMessage);
    }
  };

  const handleSavePptClick = async () => {
    setIsFilesOpen(false);
    setIsBackgroundOpen(false);
    setIsThemeOpen(false);
    await runAndNotify(
      onSavePpt,
      'PPTX download started. Check your downloads folder.',
      'Unable to save PPTX presentation.'
    );
  };

  const handleSaveJsonClick = async () => {
    setIsFilesOpen(false);
    setIsBackgroundOpen(false);
    setIsThemeOpen(false);
    await runAndNotify(
      onSaveJson,
      'JSON download started. Check your downloads folder.',
      'Unable to save JSON presentation.'
    );
  };

  const handleOpenClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const result = await (onOpenJson?.(file) ?? Promise.resolve({ status: 'success' }));
      if (result?.status === 'error') {
        window.alert(result?.message || 'Unable to open presentation.');
      } else {
        window.alert('Presentation JSON loaded successfully.');
      }
    } catch (error) {
      window.alert(error?.message || 'Unable to open presentation.');
    } finally {
      event.target.value = '';
      setIsFilesOpen(false);
    }
  };

  const closeBackgroundMenu = () => {
    setIsBackgroundOpen(false);
    if (typeof setActiveTab === 'function') {
      setActiveTab('home');
    }
  };

  const handleBackgroundClick = () => {
    const next = !isBackgroundOpen;
    setIsBackgroundOpen(next);
    setIsThemeOpen(false);
    setIsInsertOpen(false);
    setIsFilesOpen(false);
    if (typeof setActiveTab === 'function') {
      setActiveTab(next ? 'background' : 'home');
    }
  };

  const handleBackgroundOptionClick = (color) => {
    onSelectBackground?.(color);
    closeBackgroundMenu();
  };

  const handleCustomBackgroundChange = (event) => {
    onSelectBackground?.(event.target.value);
    closeBackgroundMenu();
  };

  const closeThemeMenu = () => {
    setIsThemeOpen(false);
    if (typeof setActiveTab === 'function') {
      setActiveTab('home');
    }
  };

  const handleThemeClick = () => {
    const next = !isThemeOpen;
    setIsThemeOpen(next);
    setIsBackgroundOpen(false);
    setIsInsertOpen(false);
    setIsFilesOpen(false);
    if (typeof setActiveTab === 'function') {
      setActiveTab(next ? 'theme' : 'home');
    }
  };

  const handleThemeOptionClick = (themeId) => {
    onSelectTheme?.(themeId);
    closeThemeMenu();
  };

  return (
    <header className="toolbar">
      <nav className="toolbar-actions">
        <div className="toolbar-section toolbar-section-actions">
          <div className="toolbar-files" ref={filesRef}>
            <button
              type="button"
              className={`toolbar-pill ${isFilesOpen ? 'active' : ''}`}
              onClick={handleFilesClick}
            >
              <span className="toolbar-pill-icon">F</span>
              Files
            </button>
            {isFilesOpen && (
              <div className="toolbar-menu">
                <ul className="toolbar-menu-list">
                  <li>
                    <button
                      type="button"
                      className="toolbar-menu-item"
                      onClick={handleSavePptClick}
                    >
                      <span className="toolbar-menu-icon">PT</span>
                      Save PPTX
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="toolbar-menu-item"
                      onClick={handleSaveJsonClick}
                    >
                      <span className="toolbar-menu-icon">JS</span>
                      Save JSON
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="toolbar-menu-item"
                      onClick={handleOpenClick}
                    >
                      <span className="toolbar-menu-icon">OP</span>
                      Open JSON
                    </button>
                  </li>
                </ul>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
          <div className="toolbar-insert" ref={insertRef}>
            <button
              type="button"
              className={`toolbar-pill ${activeTab === 'insert' ? 'active' : ''}`}
              onClick={handleInsertClick}
            >
              <span className="toolbar-pill-icon">+</span>
              Insert
            </button>
            {isInsertOpen && (
              <div className="toolbar-menu">
                <div className="toolbar-menu-header">Insert options</div>
                <ul className="toolbar-menu-list">
                  {insertOptions.map((option) => (
                    <li key={option.key}>
                      <button
                        type="button"
                        className="toolbar-menu-item"
                        onClick={() => handleInsertOption(option)}
                      >
                        <span className="toolbar-menu-icon">{option.icon}</span>
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="toolbar-theme" ref={themeRef}>
            <button
              type="button"
              className={`toolbar-pill ${isThemeOpen || activeTab === 'theme' ? 'active' : ''}`}
              onClick={handleThemeClick}
            >
              <span className="toolbar-pill-icon">Aa</span>
              Theme
            </button>
            {isThemeOpen && (
              <div className="toolbar-menu theme-menu">
                <div className="theme-menu-header">Preset themes</div>
                <div className="theme-list">
                  {themeOptions.map((theme) => {
                    const isActive = selectedThemeId === theme.id;
                    const accent = theme.swatchAccent || theme.accentColor || '#2563eb';
                    const textSampleColor = theme.textColor || '#ffffff';
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        className={`theme-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleThemeOptionClick(theme.id)}
                      >
                        <span
                          className="theme-swatch"
                          style={{ backgroundColor: theme.swatchBackground || theme.background }}
                        >
                          <span
                            className="theme-swatch-accent"
                            style={{ backgroundColor: accent }}
                          />
                          <span
                            className="theme-swatch-text"
                            style={{ color: textSampleColor }}
                          >
                            Aa
                          </span>
                        </span>
                        <span className="theme-name">{theme.name}</span>
                        {isActive && <span className="theme-check">{'\u2713'}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="toolbar-background" ref={backgroundRef}>
            <button
              type="button"
              className={`toolbar-pill ${isBackgroundOpen || activeTab === 'background' ? 'active' : ''}`}
              onClick={handleBackgroundClick}
            >
              <span className="toolbar-pill-icon">Bg</span>
              Background
            </button>
            {isBackgroundOpen && (
              <div className="toolbar-menu background-menu">
                <div className="background-menu-heading">Preset colors</div>
                <div className="background-color-grid">
                  {backgroundOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`background-color-option ${
                        selectedBackground === color ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleBackgroundOptionClick(color)}
                      aria-label={`Set background to ${color}`}
                    />
                  ))}
                </div>
                <label className="background-menu-custom">
                  Custom color
                  <input
                    type="color"
                    value={selectedBackground || '#050505'}
                    onChange={handleCustomBackgroundChange}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-section toolbar-section-right">
          <button
            type="button"
            className="toolbar-pill toolbar-preview"
            onClick={() => {
              setIsInsertOpen(false);
              if (typeof onPreview === 'function') {
                onPreview();
              }
            }}
          >
            <span className="toolbar-pill-icon">PR</span>
            Presentation
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Toolbar;





