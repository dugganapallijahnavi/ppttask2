import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    label: 'Paragraph',
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

const DEFAULT_COLOR = '#111827';
const HEX_FULL_REGEX = /^#[0-9a-f]{6}$/i;
const DEFAULT_VIEWPORT_WIDTH = 1440;

const normalizeFontValue = (value) => {
  if (!value) {
    return FONT_OPTIONS[0].value;
  }
  const normalized = value.replace(/"/g, '').trim();
  const exact = FONT_OPTIONS.find((item) => item.value === normalized);
  if (exact) {
    return exact.value;
  }
  const family = normalized.split(',')[0].trim();
  const fallback = FONT_OPTIONS.find((item) => item.value.startsWith(family));
  return fallback ? fallback.value : normalized;
};

const toHex = (value) => {
  if (!value) {
    return DEFAULT_COLOR;
  }
  const prefixed = value.startsWith('#') ? value : `#${value}`;
  if (HEX_FULL_REGEX.test(prefixed)) {
    return prefixed.toUpperCase();
  }
  if (/^#?[0-9a-f]{3}$/i.test(value)) {
    const cleaned = value.replace('#', '');
    const expanded = cleaned
      .split('')
      .map((char) => char + char)
      .join('');
    return `#${expanded}`.toUpperCase();
  }
  return DEFAULT_COLOR;
};

const getScaleForWidth = (width) => {
  if (width <= 480) {
    return 0.58;
  }
  if (width <= 640) {
    return 0.64;
  }
  if (width <= 900) {
    return 0.72;
  }
  if (width <= 1200) {
    return 0.82;
  }
  return 1;
};

const getResponsivePreset = (key, width) => {
  const preset = STYLE_PRESETS.find((item) => item.key === key);
  if (!preset) {
    return null;
  }
  const scale = getScaleForWidth(width || DEFAULT_VIEWPORT_WIDTH);
  const scaledSize = Math.max(12, Math.round(preset.fontSize * scale));
  return { ...preset, fontSize: scaledSize };
};

const TextToolbar = ({
  element,
  onUpdate,
  onDelete,
  position = { x: 0, y: 0 },
  isVisible = true
}) => {
  const [presetKey, setPresetKey] = useState('body');
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [textColor, setTextColor] = useState(DEFAULT_COLOR);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT_WIDTH
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const applyUpdate = useCallback((patch) => {
    if (!element || typeof onUpdate !== 'function') {
      return;
    }
    onUpdate(element.id, patch);
  }, [element, onUpdate]);

  const responsivePreset = useCallback(
    (key) => getResponsivePreset(key, viewportWidth),
    [viewportWidth]
  );

  const applyPreset = useCallback(
    (key) => {
      const preset = responsivePreset(key);
      if (!preset) {
        return;
      }
      setPresetKey(preset.key);
      setFontSize(preset.fontSize);
      setFontFamily(preset.fontFamily);
      applyUpdate({
        fontSize: preset.fontSize,
        fontFamily: preset.fontFamily,
        fontWeight: preset.fontWeight,
        textStyle: preset.key
      });
    },
    [applyUpdate, responsivePreset]
  );

  useEffect(() => {
    if (!element) {
      return;
    }
    const styleKey = element.textStyle && element.textStyle !== 'custom'
      ? element.textStyle
      : null;
    if (!styleKey) {
      return;
    }
    const preset = responsivePreset(styleKey);
    if (!preset) {
      return;
    }
    const currentSize = Math.round(element.fontSize || preset.fontSize);
    if (Math.abs(currentSize - preset.fontSize) > 1) {
      onUpdate?.(element.id, { fontSize: preset.fontSize });
    }
  }, [element, onUpdate, responsivePreset, viewportWidth]);

  useEffect(() => {
    if (!element) {
      return;
    }
    const resolvedFamily = normalizeFontValue(element.fontFamily);
    const resolvedColor = toHex(element.color || DEFAULT_COLOR);
    const resolvedSize = Math.round(element.fontSize || 20);

    setFontFamily(resolvedFamily);
    setFontSize(resolvedSize);
    setTextColor(resolvedColor);

    const matchedPreset =
      STYLE_PRESETS.find(
        (item) =>
          item.fontFamily === resolvedFamily &&
          Math.round(item.fontSize) === resolvedSize
      ) || null;
    
    if (element.textStyle) {
      setPresetKey(element.textStyle);
    } else if (matchedPreset) {
      setPresetKey(matchedPreset.key);
    } else {
      // Detect based on fontSize and fontWeight
      const fontWeight = element.fontWeight || 400;
      if (resolvedSize >= 40) {
        setPresetKey('heading');
      } else if (resolvedSize >= 28 && fontWeight >= 600) {
        setPresetKey('title');
      } else {
        setPresetKey('body'); // Default to paragraph for normal text
      }
    }
  }, [element]);

  const toolbarPosition = useMemo(() => {
    const offsetTop = Math.max(position.y - 8, 8);
    return {
      left: position.x,
      top: offsetTop
    };
  }, [position.x, position.y]);

  const handleHeadingChange = (event) => {
    applyPreset(event.target.value);
  };

  const handleFontSizeChange = (value) => {
    const numeric = Math.max(8, Math.min(200, Number(value) || fontSize));
    setFontSize(numeric);
    setPresetKey('custom');
    applyUpdate({ fontSize: numeric, textStyle: 'custom' });
  };

  const handleFontFamilyChange = (value) => {
    setFontFamily(value);
    setPresetKey('custom');
    applyUpdate({ fontFamily: value, textStyle: 'custom' });
  };

  const applyColor = (hex) => {
    const formatted = toHex(hex);
    setTextColor(formatted);
    setPresetKey('custom');
    applyUpdate({ color: formatted });
  };

  const handleColorPickerChange = (event) => {
    const value = event.target.value;
    if (value) {
      applyColor(value);
    }
  };

  const toggleBold = useCallback(() => {
    if (!element) {
      return;
    }
    const nextBold = !element.bold;
    applyUpdate({
      bold: nextBold,
      fontWeight: nextBold ? Math.max(element.fontWeight || 600, 600) : 400,
      textStyle: 'custom'
    });
  }, [element, applyUpdate]);

  const toggleItalic = useCallback(() => {
    if (!element) {
      return;
    }
    applyUpdate({
      italic: !element.italic,
      textStyle: 'custom'
    });
  }, [element, applyUpdate]);

  const toggleUnderline = useCallback(() => {
    if (!element) {
      return;
    }
    applyUpdate({
      underline: !element.underline,
      textStyle: 'custom'
    });
  }, [element, applyUpdate]);

  const handleDelete = useCallback(() => {
    if (!element || typeof onDelete !== 'function') {
      return;
    }
    onDelete(element.id);
  }, [element, onDelete]);

  if (!isVisible || !element) {
    return null;
  }

  return (
    <div
      className="text-toolbar-wrapper"
      style={{
        left: toolbarPosition.left,
        top: toolbarPosition.top,
        transform: 'translateX(-50%)'
      }}
    >
      <div
        className="text-toolbar-card"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="toolbar-item preset">
          <select
            aria-label="Text preset"
            value={presetKey === 'custom' ? 'body' : presetKey}
            onChange={handleHeadingChange}
          >
            {STYLE_PRESETS.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-item size">
          <input
            aria-label="Font size"
            type="number"
            min={8}
            max={200}
            value={fontSize}
            onChange={(event) => handleFontSizeChange(event.target.value)}
          />
        </div>

        <div className="toolbar-item font">
          <select
            aria-label="Font family"
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

        <div className="toolbar-item color">
          <input
            aria-label="Text color"
            type="color"
            value={textColor}
            onChange={handleColorPickerChange}
          />
        </div>

        <div className="toolbar-item styles">
          <button
            type="button"
            className={`text-style-button ${element.bold ? 'is-active' : ''}`}
            onClick={toggleBold}
            aria-pressed={element.bold ? 'true' : 'false'}
          >
            <span className="style-label">B</span>
          </button>
          <button
            type="button"
            className={`text-style-button ${element.italic ? 'is-active' : ''}`}
            onClick={toggleItalic}
            aria-pressed={element.italic ? 'true' : 'false'}
          >
            <span className="style-label">I</span>
          </button>
          <button
            type="button"
            className={`text-style-button ${element.underline ? 'is-active' : ''}`}
            onClick={toggleUnderline}
            aria-pressed={element.underline ? 'true' : 'false'}
          >
            <span className="style-label">U</span>
          </button>
        </div>

        <div className="toolbar-item delete">
          <button
            type="button"
            className="text-toolbar-delete"
            onClick={handleDelete}
            disabled={typeof onDelete !== 'function'}
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
};

export default TextToolbar;
