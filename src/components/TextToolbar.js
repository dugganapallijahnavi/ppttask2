import React, { useEffect, useMemo, useRef, useState } from 'react';
import './TextToolbar.css';

const STYLE_PRESETS = [
  {
    key: 'heading',
    label: 'Heading',
    fontSize: 56,
    fontFamily: 'Playfair Display, serif',
    fontWeight: 700
  },
  {
    key: 'title',
    label: 'Title',
    fontSize: 40,
    fontFamily: 'Playfair Display, serif',
    fontWeight: 600
  },
  {
    key: 'body',
    label: 'Body',
    fontSize: 20,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400
  }
];

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Playfair Display', value: 'Playfair Display, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Segoe UI', value: 'Segoe UI, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' }
];

const COLOR_SWATCHES = [
  '#f8fafc',
  '#0f172a',
  '#1e293b',
  '#1d4ed8',
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#ec4899'
];

const resolveFontValue = (value) => {
  if (!value) {
    return FONT_OPTIONS[0].value;
  }
  const normalized = value.replace(/"/g, '').trim();
  const directMatch = FONT_OPTIONS.find((option) => option.value === normalized);
  if (directMatch) {
    return directMatch.value;
  }
  const baseName = normalized.split(',')[0].trim();
  const fallback = FONT_OPTIONS.find((option) => option.value.startsWith(baseName));
  return fallback ? fallback.value : normalized;
};

const TextToolbar = ({
  element,
  onUpdate,
  onDelete,
  position = { x: 0, y: 0 },
  isVisible = false
}) => {
  const [styleKey, setStyleKey] = useState('custom');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [textColor, setTextColor] = useState('#0f172a');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const colorPickerRef = useRef(null);

  useEffect(() => {
    if (!element) {
      return;
    }
    setFontSize(Math.round(element.fontSize || 20));
    setFontFamily(resolveFontValue(element.fontFamily));
    setTextColor(element.color || '#0f172a');
    const fontWeight = element.fontWeight || (element.bold ? 700 : 400);
    setIsBold(Boolean(element.bold) || fontWeight >= 600);
    setIsItalic(Boolean(element.italic));
    setIsUnderline(Boolean(element.underline));

    const matchedPreset =
      STYLE_PRESETS.find(
        (preset) =>
          preset.fontFamily === resolveFontValue(element.fontFamily) &&
          Math.round(preset.fontSize) === Math.round(element.fontSize || 20)
      ) || null;
    setStyleKey(matchedPreset ? matchedPreset.key : 'custom');
  }, [element]);

  useEffect(() => {
    if (!colorPickerOpen) {
      return;
    }
    const handleClickAway = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [colorPickerOpen]);

  useEffect(() => {
    if (!isVisible) {
      setColorPickerOpen(false);
    }
  }, [isVisible, element?.id]);

  const toolbarPosition = useMemo(() => {
    const offsetTop = Math.max(position.y - 72, 24);
    return {
      left: position.x,
      top: offsetTop
    };
  }, [position.x, position.y]);

  const applyUpdate = (patch) => {
    if (!element || typeof onUpdate !== 'function') {
      return;
    }
    onUpdate({ ...element, ...patch });
  };

  const handleStyleSelect = (preset) => {
    setStyleKey(preset.key);
    setFontSize(preset.fontSize);
    setFontFamily(preset.fontFamily);
    const boldFlag = preset.fontWeight >= 600;
    setIsBold(boldFlag);
    setIsItalic(false);
    setIsUnderline(false);
    applyUpdate({
      fontSize: preset.fontSize,
      fontFamily: preset.fontFamily,
      fontWeight: preset.fontWeight,
      bold: boldFlag,
      italic: false,
      underline: false
    });
  };

  const handleFontSizeChange = (value) => {
    const numeric = Math.max(8, Math.min(200, Number(value) || 20));
    setFontSize(numeric);
    setStyleKey('custom');
    applyUpdate({ fontSize: numeric });
  };

  const handleFontFamilyChange = (value) => {
    setFontFamily(value);
    setStyleKey('custom');
    applyUpdate({ fontFamily: value });
  };

  const handleColorSelect = (color) => {
    setTextColor(color);
    setStyleKey('custom');
    applyUpdate({ color });
    setColorPickerOpen(false);
  };

  const toggleStyle = (styleKey, currentValue) => {
    const nextValue = !currentValue;
    switch (styleKey) {
      case 'bold':
        setIsBold(nextValue);
        applyUpdate({
          bold: nextValue,
          fontWeight: nextValue ? 700 : 400
        });
        break;
      case 'italic':
        setIsItalic(nextValue);
        applyUpdate({ italic: nextValue });
        break;
      case 'underline':
        setIsUnderline(nextValue);
        applyUpdate({ underline: nextValue });
        break;
      default:
        break;
    }
    setStyleKey('custom');
  };

  if (!isVisible || !element) {
    return null;
  }

  return (
    <div
      className="text-floating-toolbar"
      style={{
        left: toolbarPosition.left,
        top: toolbarPosition.top,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="text-toolbar-shell">
        <div className="toolbar-cluster presets">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`preset-btn ${styleKey === preset.key ? 'active' : ''}`}
              onClick={() => handleStyleSelect(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-cluster size-family">
          <input
            type="number"
            className="size-input"
            value={fontSize}
            min={8}
            max={200}
            onChange={(event) => handleFontSizeChange(event.target.value)}
          />
          <select
            className="family-select"
            value={fontFamily}
            onChange={(event) => handleFontFamilyChange(event.target.value)}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-divider" />

        <div className="color-picker" ref={colorPickerRef}>
          <button
            type="button"
            className="color-toggle"
            style={{ backgroundColor: textColor }}
            onClick={(event) => {
              event.stopPropagation();
              setColorPickerOpen((prev) => !prev);
            }}
            aria-label="Toggle color options"
          />
          {colorPickerOpen && (
            <div className="color-popover">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-chip ${textColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Set color ${color}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-cluster style-toggles">
          <button
            type="button"
            className={isBold ? 'active' : ''}
            onClick={() => toggleStyle('bold', isBold)}
          >
            B
          </button>
          <button
            type="button"
            className={isItalic ? 'active' : ''}
            onClick={() => toggleStyle('italic', isItalic)}
          >
            I
          </button>
          <button
            type="button"
            className={isUnderline ? 'active' : ''}
            onClick={() => toggleStyle('underline', isUnderline)}
          >
            U
          </button>
        </div>

        <div className="toolbar-divider" />

        <button
          type="button"
          className="toolbar-delete"
          onClick={() => onDelete?.(element.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TextToolbar;

