// src/components/PresentationApp.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './PresentationApp.css';
import { Rnd } from 'react-rnd';
import ChartComponent from './ChartComponent';
import ChartDataEditor from './ChartDataEditor';
import ImageComponent from './ImageComponent';
import RichTextEditor from './RichTextEditor';
import TextToolbar from './TextToolbar';
import ShapeToolbar from './ShapeToolbar';
import ChartToolbar from './ChartToolbar';

import SlidePanel from './SlidePanel';
import EnhancedToolbar from './EnhancedToolbar';
import { createSlideFromLayout } from '../data/slideLayouts';
import { exportSlidesAsPptx } from '../utils/pptxExport';

const DEFAULT_BACKGROUND = '#ffffff';
const TEXT_TOOLBAR_HALF_WIDTH = 200;
const TEXT_TOOLBAR_VERTICAL_OFFSET = 70;
const MIN_TEXT_WIDTH = 120;
const MIN_TEXT_HEIGHT = 40;
const MIN_ELEMENT_SIZE = 60;
const MIN_CHART_HEIGHT = 120;

// Theme definitions
const themes = {
  minimal: {
    name: 'Minimal',
    colors: {
      primary: '#111827',
      secondary: '#1f2933',
      accent: '#000000',
      background: '#ffffff'
    }
  },
  newClassic: {
    name: 'New classic',
    colors: {
      primary: '#f3f4f6',
      secondary: '#94a3b8',
      accent: '#0f766e',
      background: '#0b0d16'
    }
  },
  retroTech: {
    name: 'Retro tech',
    colors: {
      primary: '#111827',
      secondary: '#1f2937',
      accent: '#14b8a6',
      background: '#f8fafc'
    }
  },
  boldMinimalist: {
    name: 'Bold minimalist',
    colors: {
      primary: '#ffffff',
      secondary: '#e0e7ff',
      accent: '#ffffff',
      background: '#1e3a8a'
    }
  },
  modernTech: {
    name: 'Modern tech',
    colors: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      accent: '#6366f1',
      background: '#111827'
    }
  }
};

// Background color options
const backgroundColors = [
  '#000000', '#1a1a1a', '#2a2a2a', '#333333',
  '#ffffff', '#f5f5f5', '#e5e5e5', '#d4d4d4',
  '#bbbbbb', '#999999', '#777777', '#555555',
  '#444444', '#3d3d3d', '#2f2f2f', '#1f1f1f',
  '#1e40af', '#2563eb', '#38bdf8', '#0ea5e9',
  '#f97316', '#fb7185', '#facc15', '#22c55e'
];

const CHART_COLOR_PALETTE = [
  '#111111',
  '#2d2d2d',
  '#515151',
  '#6b6b6b',
  '#868686',
  '#a3a3a3',
  '#c7c7c7'
];

const CHART_DIMENSIONS = {
  bar: { width: 420, height: 280 },
  area: { width: 410, height: 260 },
  pie: { width: 320, height: 320 },
  columnLine: { width: 430, height: 290 }
};

const chartTypeLabels = {
  bar: 'Bar chart',
  area: 'Area chart',
  pie: 'Pie chart',
  columnLine: 'Column + Line chart'
};

const createId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const getPaletteColor = (index) =>
  CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length];

const parseHexColor = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const hex = value.replace('#', '');
  if (![3, 6].includes(hex.length) || Number.isNaN(parseInt(hex, 16))) {
    return null;
  }
  const normalized = hex.length === 3
    ? hex.split('').map((char) => `${char}${char}`).join('')
    : hex;
  const intValue = parseInt(normalized, 16);
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255
  };
};

const isDarkHexColor = (value) => {
  const rgb = parseHexColor(value);
  if (!rgb) {
    return false;
  }
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
};

const createDefaultChartData = (chartType) => {
  const type = chartType || 'bar';
  const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];

  switch (type) {
    case 'bar':
      return {
        type: 'bar',
        title: 'Bar Chart',
        labels: quarterLabels,
        datasets: [
          {
            id: createId('series'),
            label: 'North',
            data: [48, 38, 44, 52],
            color: getPaletteColor(0),
            variant: 'bar'
          },
          {
            id: createId('series'),
            label: 'South',
            data: [36, 41, 30, 44],
            color: getPaletteColor(1),
            variant: 'bar'
          },
          {
            id: createId('series'),
            label: 'West',
            data: [28, 34, 36, 32],
            color: getPaletteColor(2),
            variant: 'bar'
          }
        ]
      };
    case 'area':
      return {
        type: 'area',
        title: 'Area Chart',
        labels: quarterLabels,
        datasets: [
          {
            id: createId('series'),
            label: 'Organic',
            data: [18, 26, 32, 28],
            color: getPaletteColor(0),
            variant: 'area',
            fill: true
          },
          {
            id: createId('series'),
            label: 'Paid',
            data: [12, 18, 22, 26],
            color: getPaletteColor(1),
            variant: 'area',
            fill: true
          },
          {
            id: createId('series'),
            label: 'Referral',
            data: [8, 12, 18, 20],
            color: getPaletteColor(2),
            variant: 'area',
            fill: true
          }
        ]
      };
    case 'pie': {
      const labels = ['North', 'South', 'East', 'West'];
      return {
        type: 'pie',
        title: 'Pie Chart',
        labels,
        datasets: [
          {
            id: createId('series'),
            label: 'Share',
            data: [32, 26, 18, 24],
            color: getPaletteColor(0),
            variant: 'pie',
            segmentColors: labels.map((_, index) => getPaletteColor(index))
          }
        ]
      };
    }
    case 'columnLine':
      return {
        type: 'columnLine',
        title: 'Column + Line',
        labels: quarterLabels,
        datasets: [
          {
            id: createId('series'),
            label: 'Revenue',
            data: [45, 58, 64, 60],
            color: getPaletteColor(0),
            variant: 'bar'
          },
          {
            id: createId('series'),
            label: 'Costs',
            data: [24, 32, 38, 30],
            color: getPaletteColor(2),
            variant: 'bar'
          },
          {
            id: createId('series'),
            label: 'Conversion',
            data: [28, 34, 42, 48],
            color: getPaletteColor(1),
            variant: 'line'
          }
        ]
      };
    default:
      return {
        type: 'bar',
        title: 'Bar Chart',
        labels: quarterLabels,
        datasets: [
          {
            id: createId('series'),
            label: 'North',
            data: [48, 38, 44, 52],
            color: getPaletteColor(0),
            variant: 'bar'
          },
          {
            id: createId('series'),
            label: 'South',
            data: [36, 41, 30, 44],
            color: getPaletteColor(1),
            variant: 'bar'
          },
          {
            id: createId('series'),
            label: 'West',
            data: [28, 34, 36, 32],
            color: getPaletteColor(2),
            variant: 'bar'
          }
        ]
      };
  }
};

const createSlide = (index, layoutId = 'title') => {
  const slideData = createSlideFromLayout(layoutId);
  const layoutBackground =
    typeof slideData.background === 'string'
      ? slideData.background
      : slideData.background?.color;
  const backgroundColor =
    index === 0
      ? DEFAULT_BACKGROUND
      : layoutBackground || DEFAULT_BACKGROUND;
  const isDarkBackground = isDarkHexColor(backgroundColor);
  const content = (slideData.content || []).map((item) => {
    if (!item) {
      return item;
    }
    if (item.type === 'text') {
      return {
        ...item,
        color: isDarkBackground ? '#f5f5f5' : item.color || '#111111'
      };
    }
    return { ...item };
  });

  return {
    id: Date.now() + index,
    title: `Slide ${index + 1}`,
    content,
    background: {
      color: backgroundColor
    }
  };
};

const PresentationApp = () => {
  const [slides, setSlides] = useState([createSlide(0, 'title')]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('minimal');
  const [hoveredElement, setHoveredElement] = useState(null);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [shapeToolbarPosition, setShapeToolbarPosition] = useState(null);
  const [chartToolbarPosition, setChartToolbarPosition] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [chartEditorId, setChartEditorId] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [keepInsertEnabled, setKeepInsertEnabled] = useState(false);
  // Defer element placement until user clicks on slide
  const [pendingInsert, setPendingInsert] = useState(null);
  const [pendingInsertPos, setPendingInsertPos] = useState(null);
  const imageInputRef = useRef(null);
  const cancelPendingInsert = useCallback(() => {
    setPendingInsert(null);
    setPendingInsertPos(null);
  }, []);
  const slideRef = useRef(null);
  const elementRefs = useRef({});

  const registerElementRef = useCallback(
    (id) => (node) => {
      if (node) {
        elementRefs.current[id] = node;
      } else {
        delete elementRefs.current[id];
      }
    },
    []
  );

  const focusTextElement = useCallback((elementId, attempt = 0) => {
    if (!elementId) {
      return;
    }

    const run = () => {
      const wrapper = elementRefs.current[elementId];
      if (!wrapper) {
        if (attempt < 6) {
          setTimeout(() => focusTextElement(elementId, attempt + 1), 32);
        }
        return;
      }

      const editable = wrapper.querySelector('[data-text-editable="true"]');
      if (!editable) {
        if (attempt < 6) {
          setTimeout(() => focusTextElement(elementId, attempt + 1), 32);
        }
        return;
      }

      if (editable !== document.activeElement) {
        editable.focus({ preventScroll: false });
      }

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(editable);
          range.collapse(false);
          selection.addRange(range);
        }
      }
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(run);
    } else {
      run();
    }
  }, []);

  const updateTextToolbarPosition = useCallback(
    (elementId) => {
      const slideNode = slideRef.current;
      const elementNode = elementRefs.current[elementId];
      if (!slideNode || !elementNode) {
        return;
      }

      const slideRect = slideNode.getBoundingClientRect();
      const elementRect = elementNode.getBoundingClientRect();
      const centerX =
        elementRect.left - slideRect.left + elementRect.width / 2;
      const clampedX = Math.max(
        TEXT_TOOLBAR_HALF_WIDTH,
        Math.min(centerX, slideRect.width - TEXT_TOOLBAR_HALF_WIDTH)
      );
      const relativeTop = Math.max(
        elementRect.top - slideRect.top - TEXT_TOOLBAR_VERTICAL_OFFSET,
        8
      );
      setToolbarPosition({
        x: clampedX,
        y: relativeTop
      });
    },
    [setToolbarPosition]
  );

  const updateShapeToolbarPosition = useCallback(
    (elementId) => {
      const slideNode = slideRef.current;
      const elementNode = elementRefs.current[elementId];
      if (!slideNode || !elementNode) {
        return;
      }

      const slideRect = slideNode.getBoundingClientRect();
      const elementRect = elementNode.getBoundingClientRect();
      const centerX = elementRect.left - slideRect.left + elementRect.width / 2;
      const clampedX = Math.max(24, Math.min(centerX, slideRect.width - 24));
      const relativeTop = Math.max(elementRect.top - slideRect.top, 0);

      setShapeToolbarPosition({
        x: clampedX,
        y: relativeTop
      });
    },
    []
  );

  // Keyboard navigation and click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isNextKey =
        e.key === 'ArrowDown' ||
        (isSlideshow && e.key === 'ArrowRight');
      const isPrevKey =
        e.key === 'ArrowUp' ||
        (isSlideshow && e.key === 'ArrowLeft');

      if (isNextKey && currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(currentSlideIndex + 1);
      } else if (isPrevKey && currentSlideIndex > 0) {
        setCurrentSlideIndex(currentSlideIndex - 1);
      } else if (e.key === 'F5') {
        e.preventDefault();
        setIsSlideshow(true);
      } else if (e.key === 'Escape') {
        if (isSlideshow) {
          setIsSlideshow(false);
        } else if (activeDropdown) {
          setActiveDropdown(null);
        } else if (editingImage) {
          setEditingImage(null);
        } else if (pendingInsert) {
          cancelPendingInsert();
        } else {
          setSelectedElement(null);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (activeDropdown && !e.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
      if (editingImage && !e.target.closest('.image-editing-container')) {
        setEditingImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [
    currentSlideIndex,
    slides.length,
    isSlideshow,
    activeDropdown,
    editingImage,
    pendingInsert,
    cancelPendingInsert
  ]);

  const addSlide = (layoutId = 'title') => {
    const newSlide = createSlide(slides.length, layoutId);
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };


  const deleteSlide = (index) => {
    if (slides.length <= 1) return;
    
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    } else if (currentSlideIndex > index) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const moveSlide = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const newSlides = [...slides];
    const [movedSlide] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, movedSlide);
    
    setSlides(newSlides);
    
    // Update current slide index
    if (fromIndex === currentSlideIndex) {
      setCurrentSlideIndex(toIndex);
    } else if (fromIndex < currentSlideIndex && toIndex >= currentSlideIndex) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (fromIndex > currentSlideIndex && toIndex <= currentSlideIndex) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const updateSlide = useCallback((index, updatedSlide) => {
    setSlides((prevSlides) => {
      const nextSlides = [...prevSlides];
      nextSlides[index] = updatedSlide;
      return nextSlides;
    });
  }, []);

  const updateElement = useCallback((elementId, updates) => {
    setSlides((prevSlides) => {
      const nextSlides = [...prevSlides];
      const slide = nextSlides[currentSlideIndex];
      if (!slide) {
        return prevSlides;
      }
      const updatedContent = (slide.content || []).map((item) =>
        item.id === elementId ? { ...item, ...updates } : item
      );
      nextSlides[currentSlideIndex] = { ...slide, content: updatedContent };
      return nextSlides;
    });

    setSelectedElement((current) =>
      current && current.id === elementId ? { ...current, ...updates } : current
    );
  }, [currentSlideIndex]);

  const handleElementPointerDown = useCallback(
    (event, element) => {
      if (pendingInsert) {
        return;
      }
      event.stopPropagation();
      setSelectedElement(element);
      if (element.type === 'text') {
        setHoveredElement(element.id);
        updateTextToolbarPosition(element.id);
        setShapeToolbarPosition(null);
      } else if (element.type === 'shape') {
        updateShapeToolbarPosition(element.id);
        setToolbarPosition({ x: 0, y: 0 });
      }
    },
    [pendingInsert, updateShapeToolbarPosition, updateTextToolbarPosition]
  );

  const handleDragStart = useCallback(
    (element) => {
      if (pendingInsert) {
        return;
      }
      setSelectedElement(element);
      if (element.type === 'text') {
        setHoveredElement(element.id);
        updateTextToolbarPosition(element.id);
        setShapeToolbarPosition(null);
      } else if (element.type === 'shape') {
        updateShapeToolbarPosition(element.id);
        setToolbarPosition({ x: 0, y: 0 });
      }
      setEditingTextId((current) => (current === element.id ? null : current));
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }
    },
    [pendingInsert, updateShapeToolbarPosition, updateTextToolbarPosition]
  );

  const handleDragStop = useCallback(
    (element, position) => {
      if (pendingInsert) {
        return;
      }
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
      if (element.type === 'text') {
        setHoveredElement(element.id);
        updateTextToolbarPosition(element.id);
      } else if (element.type === 'shape') {
        updateShapeToolbarPosition(element.id);
      }
      updateElement(element.id, {
        x: Math.round(position.x),
        y: Math.round(position.y)
      });
    },
    [pendingInsert, updateElement, updateShapeToolbarPosition, updateTextToolbarPosition]
  );

  const handleResizeStart = useCallback(
    (element) => {
      if (pendingInsert) {
        return;
      }
      setSelectedElement(element);
      if (element.type === 'text') {
        setHoveredElement(element.id);
        updateTextToolbarPosition(element.id);
        setShapeToolbarPosition(null);
      } else if (element.type === 'shape') {
        updateShapeToolbarPosition(element.id);
        setToolbarPosition({ x: 0, y: 0 });
      }
      setEditingTextId((current) => (current === element.id ? null : current));
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'nwse-resize';
      }
    },
    [pendingInsert, updateShapeToolbarPosition, updateTextToolbarPosition]
  );

  const handleResizeStop = useCallback(
    (element, direction, ref, position) => {
      if (pendingInsert) {
        return;
      }
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
      const widthValue = Number.parseFloat(ref.style.width);
      const heightValue = Number.parseFloat(ref.style.height);
      const fallbackWidth =
        element.type === 'text' ? MIN_TEXT_WIDTH : MIN_ELEMENT_SIZE;
      const fallbackHeight =
        element.type === 'text'
          ? MIN_TEXT_HEIGHT
          : element.type === 'chart'
          ? MIN_CHART_HEIGHT
          : MIN_ELEMENT_SIZE;

      const previousLeft =
        typeof element.x === 'number' && Number.isFinite(element.x)
          ? element.x
          : 0;
      const previousTop =
        typeof element.y === 'number' && Number.isFinite(element.y)
          ? element.y
          : 0;
      const previousWidth =
        typeof element.width === 'number' && Number.isFinite(element.width)
          ? element.width
          : fallbackWidth;
      const previousHeight =
        typeof element.height === 'number' && Number.isFinite(element.height)
          ? element.height
          : fallbackHeight;

      const computedWidth = Math.round(
        Number.isFinite(widthValue) ? widthValue : fallbackWidth
      );
      const computedHeight = Math.round(
        Number.isFinite(heightValue) ? heightValue : fallbackHeight
      );

      const normalizedDirection = String(direction || '').toLowerCase();
      const fromWest = normalizedDirection.includes('left');
      const fromNorth = normalizedDirection.includes('top');
      const anchoredRight = previousLeft + previousWidth;
      const anchoredBottom = previousTop + previousHeight;

      updateElement(element.id, {
        width: Math.max(fallbackWidth, computedWidth),
        height: Math.max(fallbackHeight, computedHeight),
        x: fromWest
          ? Math.round(Math.max(0, anchoredRight - computedWidth))
          : Math.round(position.x),
        y: fromNorth
          ? Math.round(Math.max(0, anchoredBottom - computedHeight))
          : Math.round(position.y)
      });

      if (element.type === 'text') {
        setHoveredElement(element.id);
        updateTextToolbarPosition(element.id);
      } else if (element.type === 'shape') {
        updateShapeToolbarPosition(element.id);
      }
    },
    [pendingInsert, updateElement, updateShapeToolbarPosition, updateTextToolbarPosition]
  );

  const deleteElement = useCallback((elementId) => {
    setSlides((prevSlides) => {
      const nextSlides = [...prevSlides];
      const slide = nextSlides[currentSlideIndex];
      if (!slide) {
        return prevSlides;
      }
      nextSlides[currentSlideIndex] = {
        ...slide,
        content: (slide.content || []).filter((item) => item.id !== elementId)
      };
      return nextSlides;
    });
    setSelectedElement((current) => (current && current.id === elementId ? null : current));
    setHoveredElement((current) => (current === elementId ? null : current));
    if (selectedElement && selectedElement.id === elementId) {
      setShapeToolbarPosition(null);
      setChartToolbarPosition(null);
      setToolbarPosition({ x: 0, y: 0 });
    }
    if (editingImage === elementId) {
      setEditingImage(null);
    }
    setChartEditorId((current) => (current === elementId ? null : current));
  }, [currentSlideIndex, editingImage, selectedElement]);

  const currentSlide = useMemo(
    () => slides[currentSlideIndex] || {},
    [slides, currentSlideIndex]
  );
  const activeSlideBackground = useMemo(() => {
    if (!currentSlide || !currentSlide.background) {
      return DEFAULT_BACKGROUND;
    }
    if (typeof currentSlide.background === 'string') {
      return currentSlide.background;
    }
    return currentSlide.background.color || DEFAULT_BACKGROUND;
  }, [currentSlide]);

  const activeShapeElement = useMemo(() => {
    if (selectedElement?.type === 'shape') {
      return selectedElement;
    }
    if (hoveredElement) {
      return (
        currentSlide.content?.find(
          (item) => item.id === hoveredElement && item.type === 'shape'
        ) || null
      );
    }
    return null;
  }, [currentSlide, hoveredElement, selectedElement]);

  const handleToggleKeepInsert = (enabled) => {
    setKeepInsertEnabled(enabled);
    if (!enabled) {
      cancelPendingInsert();
    }
  };

  const chartEditorElement = useMemo(() => {
    if (!chartEditorId) {
      return null;
    }
    const slide = slides[currentSlideIndex];
    return slide?.content?.find((item) => item.id === chartEditorId && item.type === 'chart') || null;
  }, [chartEditorId, slides, currentSlideIndex]);

  useEffect(() => {
    if (chartEditorId && !chartEditorElement) {
      setChartEditorId(null);
    }
  }, [chartEditorId, chartEditorElement]);

  const closeChartEditor = useCallback(() => setChartEditorId(null), []);

  const handleChartEditorSave = useCallback((updatedChartData) => {
    if (!chartEditorElement) {
      return;
    }
    updateElement(chartEditorElement.id, {
      chartData: updatedChartData,
      chartType: updatedChartData.type || chartEditorElement.chartType || 'bar'
    });
    setChartEditorId(null);
  }, [chartEditorElement, updateElement]);

  const describeInsertTarget = (config) => {
    if (!config) {
      return '';
    }
    const toTitle = (value) => value.charAt(0).toUpperCase() + value.slice(1);
    if (config.type === 'shape') {
      return toTitle(config.subtype || 'shape');
    }
    return toTitle(config.type);
  };

  const changeBackgroundColor = (color) => {
    updateSlide(currentSlideIndex, {
      ...currentSlide,
      background: { ...currentSlide.background, color }
    });
  };

  const applyTheme = (themeId) => {
    const theme = themes[themeId];
    setCurrentTheme(themeId);
    
    // Apply theme to current slide
    updateSlide(currentSlideIndex, {
      ...currentSlide,
      background: { ...currentSlide.background, color: theme.colors.background },
      content: currentSlide.content?.map(el => ({
        ...el,
        color: el.type === 'text' ? theme.colors.primary : el.color
      }))
    });
    
    setActiveDropdown(null);
  };

  useEffect(() => {
    if (!currentSlide) {
      setSelectedElement(null);
      setHoveredElement(null);
      setEditingTextId(null);
      setShapeToolbarPosition(null);
      setToolbarPosition({ x: 0, y: 0 });
      return;
    }

    const content = currentSlide.content || [];
    const selectedId = selectedElement?.id;
    const selectionStillValid =
      selectedId && content.some((item) => item.id === selectedId);

    if (selectionStillValid) {
      if (selectedElement?.type === 'text') {
        updateTextToolbarPosition(selectedElement.id);
        setShapeToolbarPosition(null);
      } else if (selectedElement?.type === 'shape') {
        updateShapeToolbarPosition(selectedElement.id);
        setToolbarPosition({ x: 0, y: 0 });
      }
      return;
    }

    setSelectedElement(null);
    setHoveredElement(null);
    setEditingTextId(null);
    setShapeToolbarPosition(null);
    setToolbarPosition({ x: 0, y: 0 });
  }, [
    currentSlide,
    selectedElement,
    updateShapeToolbarPosition,
    updateTextToolbarPosition
  ]);

  useEffect(() => {
    if (editingTextId && selectedElement?.id !== editingTextId) {
      setEditingTextId(null);
    }
  }, [editingTextId, selectedElement?.id]);

  useEffect(() => {
    if (!editingTextId) {
      return;
    }
    const slideContent = currentSlide?.content || [];
    if (!slideContent.some((item) => item.id === editingTextId)) {
      return;
    }
    focusTextElement(editingTextId);
    updateTextToolbarPosition(editingTextId);
  }, [currentSlide, editingTextId, focusTextElement, updateTextToolbarPosition]);

  const addElement = (type, subtype = null) => {
    const defaultTextColor = isDarkHexColor(activeSlideBackground) ? '#f5f5f5' : '#111111';
    const id = `element-${Date.now()}`;
    let newElement = null;

    // Default center position
    const centerX = 120;
    const centerY = 120;

    if (type === 'text') {
      newElement = {
        id,
        type: 'text',
        x: centerX,
        y: centerY,
        width: 320,
        height: 60,
        fontSize: 20,
        color: defaultTextColor,
        fontFamily: 'Playfair Display',
        text: '<p>Click to edit text</p>',
        plainText: 'Click to edit text',
        textAlign: 'left',
        fontWeight: 700,
        bold: true,
        italic: false,
        underline: false
      };

      updateSlide(currentSlideIndex, {
        ...currentSlide,
        content: [...(currentSlide.content || []), newElement]
      });

      setSelectedElement(newElement);
      setHoveredElement(newElement.id);
      setEditingTextId(newElement.id);
      focusTextElement(newElement.id);
      updateTextToolbarPosition(newElement.id);
      setPendingInsert(null);
      setPendingInsertPos(null);
      setActiveDropdown(null);
      return;
    }

    if (type === 'shape') {
      newElement = {
        id,
        type: 'shape',
        shape: subtype || 'rectangle',
        x: centerX,
        y: centerY,
        width: 160,
        height: 100,
        color: '#6b7280',
        borderColor: '#6b7280',
        borderWidth: 2
      };
    } else if (type === 'chart') {
      const chartType = subtype || 'bar';
      const defaultChart = createDefaultChartData(chartType);
      const dimensions = CHART_DIMENSIONS[chartType] || { width: 360, height: 240 };
      const clonedDatasets = (defaultChart.datasets || []).map((dataset) => ({
        ...dataset,
        data: Array.isArray(dataset.data) ? [...dataset.data] : []
      }));

      newElement = {
        id,
        type: 'chart',
        x: centerX,
        y: centerY,
        width: dimensions.width,
        height: dimensions.height,
        chartType,
        chartData: {
          ...defaultChart,
          datasets: clonedDatasets
        }
      };
    } else if (type === 'image') {
      // Directly open file picker for images
      const id = `element-${Date.now()}`;
      setPendingInsertPos({
        x: centerX,
        y: centerY,
        id,
        type: 'image',
        subtype: subtype || null
      });
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
        imageInputRef.current.click();
      }
      setActiveDropdown(null);
      return;
    }

    if (newElement) {
      updateSlide(currentSlideIndex, {
        ...currentSlide,
        content: [...(currentSlide.content || []), newElement]
      });

      setSelectedElement(newElement);
      setHoveredElement(newElement.id);
      setPendingInsert(null);
      setPendingInsertPos(null);
      setActiveDropdown(null);
    }
  };

  const placeElementAt = (clientX, clientY, hostRect = null) => {
    if (!pendingInsert) {
      return;
    }

    const insertConfig = pendingInsert;
    const nextInsertConfig = {
      type: insertConfig.type,
      subtype: insertConfig.subtype || null
    };

    let rect = hostRect;
    if (!rect) {
      const slideEl = document.querySelector('.editor-layout .slide-editor .slide');
      if (!slideEl) {
        return;
      }
      rect = slideEl.getBoundingClientRect();
    }

    const x = Math.max(0, Math.min(clientX - rect.left, rect.width - 10));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height - 10));

    const id = `element-${Date.now()}`;
    let newElement = null;
    const defaultTextColor = isDarkHexColor(activeSlideBackground)
      ? '#f5f5f5'
      : '#111111';

    switch (insertConfig.type) {
      case 'text':
        newElement = {
          id,
          type: 'text',
          x,
          y,
          width: 320,
          height: 60,
          fontSize: 20,
          color: defaultTextColor,
          fontFamily: 'Playfair Display, serif',
          text: '<p>Click to edit text</p>',
          plainText: 'Click to edit text',
          textAlign: 'left',
          fontWeight: 700,
          bold: true,
          italic: false,
          underline: false
        };
        break;
      case 'shape':
        newElement = {
          id,
          type: 'shape',
          shape: insertConfig.subtype || 'rectangle',
          x,
          y,
          width: 160,
          height: 100,
          color: '#6b7280',
          borderColor: '#6b7280',
          borderWidth: 2
        };
        break;
      case 'line':
        newElement = {
          id,
          type: 'line',
          x,
          y,
          width: 220,
          height: 2,
          color: '#ffffff',
          strokeWidth: 2
        };
        break;
      case 'chart': {
        const chartType = insertConfig.subtype || 'bar';
        const defaultChart = createDefaultChartData(chartType);
        const dimensions = CHART_DIMENSIONS[chartType] || { width: 360, height: 240 };
        const clonedDatasets = (defaultChart.datasets || []).map((dataset) => ({
          ...dataset,
          data: Array.isArray(dataset.data) ? [...dataset.data] : []
        }));

        newElement = {
          id,
          type: 'chart',
          x,
          y,
          width: dimensions.width,
          height: dimensions.height,
          chartType,
          chartData: {
            ...defaultChart,
            datasets: clonedDatasets
          }
        };
        break;
      }
      case 'image':
        setPendingInsertPos({
          x,
          y,
          id,
          type: insertConfig.type,
          subtype: insertConfig.subtype || null
        });
        if (imageInputRef.current) {
          imageInputRef.current.value = '';
          imageInputRef.current.click();
        }
        setPendingInsert(keepInsertEnabled ? nextInsertConfig : null);
        return;
      default:
        break;
    }

    if (newElement) {
      updateSlide(currentSlideIndex, {
        ...currentSlide,
        content: [...(currentSlide.content || []), newElement]
      });
      setSelectedElement(newElement);
      if (newElement.type === 'text') {
        setHoveredElement(newElement.id);
        setEditingTextId(newElement.id);
        focusTextElement(newElement.id);
        updateTextToolbarPosition(newElement.id);
      }
    }

    setPendingInsert(keepInsertEnabled ? nextInsertConfig : null);
    setPendingInsertPos(null);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      if (!keepInsertEnabled) {
        cancelPendingInsert();
      }
      return;
    }

    if (!pendingInsertPos) {
      return;
    }

    const insertInfo = pendingInsertPos;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSrc = event.target.result;
      const meta = {
        src: imageSrc,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const maxWidth = 400;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { width = maxWidth; height = width / aspectRatio; }
        if (height > maxHeight) { height = maxHeight; width = height * aspectRatio; }
        const imageElement = {
          id: insertInfo.id || `element-${Date.now()}`,
          type: 'image',
          x: insertInfo.x,
          y: insertInfo.y,
          width,
          height,
          src: imageSrc,
          imageData: meta,
          alt: file.name
        };
        updateSlide(currentSlideIndex, {
          ...currentSlide,
          content: [...(currentSlide.content || []), imageElement]
        });
        setSelectedElement(imageElement);
        setPendingInsertPos(null);
        if (!keepInsertEnabled) {
          setPendingInsert(null);
        }
      };
      img.src = imageSrc;
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const savePresentation = useCallback(async () => {
    try {
      await exportSlidesAsPptx(slides, 'presentation.pptx');
      setActiveDropdown(null);
    } catch (error) {
      console.error('Failed to export presentation', error);
      window.alert('Unable to export the presentation. Please try again.');
    }
  }, [slides]);

  return (
    <>
      <div className="presentation-app">
        {!isSlideshow ? (
          <div className="editor-layout">
            {/* Enhanced Toolbar */}
            <EnhancedToolbar
              onInsertElement={addElement}
              onBackgroundChange={changeBackgroundColor}
              onThemeChange={applyTheme}
              onSavePresentation={savePresentation}
              onStartSlideshow={() => setIsSlideshow(true)}
              currentBackground={currentSlide.background?.color || DEFAULT_BACKGROUND}
              currentTheme={currentTheme}
              themes={Object.entries(themes).map(([id, theme]) => ({ id, ...theme }))}
              backgroundColors={backgroundColors}
              keepInsertEnabled={keepInsertEnabled}
              onToggleKeepInsert={handleToggleKeepInsert}
            />

            {/* Main Content Area */}
            <main className="main-content">
              {/* Left Sidebar */}
              <SlidePanel
                slides={slides}
                currentSlide={currentSlideIndex}
                setCurrentSlide={setCurrentSlideIndex}
                addSlide={addSlide}
                deleteSlide={deleteSlide}
                moveSlide={moveSlide}
              />

              {/* Center - Slide Editor */}
              <div className="slide-editor">
                <div 
                  className="slide" 
                  style={{
                    backgroundColor: currentSlide.background?.color || DEFAULT_BACKGROUND,
                    cursor: pendingInsert ? 'crosshair' : 'default'
                  }}
                  ref={slideRef}
                  onClick={(e) => {
                    if (pendingInsert) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      placeElementAt(e.clientX, e.clientY, rect);
                    } else {
                      setSelectedElement(null);
                    }
                  }}
                >
                  {currentSlide.content?.map((element) => {
                    const isSelected = selectedElement?.id === element.id;

                    const handleElementClick = (event) => {
                      if (pendingInsert) {
                        event.stopPropagation();
                        const slideNode = event.currentTarget.closest('.slide');
                        if (slideNode) {
                          const slideRect = slideNode.getBoundingClientRect();
                          placeElementAt(event.clientX, event.clientY, slideRect);
                        }
                        return;
                      }

                      event.stopPropagation();
                      setSelectedElement(element);
                      if (element.type === 'text') {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const slideRect = slideRef.current?.getBoundingClientRect();
                        if (slideRect) {
                          const centerX = rect.left - slideRect.left + rect.width / 2;
                          const clampedX = Math.max(
                            TEXT_TOOLBAR_HALF_WIDTH,
                            Math.min(centerX, slideRect.width - TEXT_TOOLBAR_HALF_WIDTH)
                          );
                          const relativeTop = Math.max(
                            rect.top - slideRect.top - TEXT_TOOLBAR_VERTICAL_OFFSET,
                            8
                          );
                          setHoveredElement(element.id);
                          setToolbarPosition({
                            x: clampedX,
                            y: relativeTop
                          });
                        }
                      } else if (element.type === 'chart') {
                        setHoveredElement(element.id);
                        
                        // Calculate position directly from the event
                        const rect = event.currentTarget.getBoundingClientRect();
                        const slideRect = slideRef.current?.getBoundingClientRect();
                        if (slideRect) {
                          const centerX = rect.left - slideRect.left + rect.width / 2;
                          const clampedX = Math.max(100, Math.min(centerX, slideRect.width - 100));
                          const relativeTop = Math.max(rect.top - slideRect.top - 48, 8);
                          
                          setChartToolbarPosition({
                            x: clampedX,
                            y: relativeTop
                          });
                        }
                        
                        setToolbarPosition({ x: 0, y: 0 });
                        setShapeToolbarPosition(null);
                      }
                    };

                    const handleWrapperEnter = (event) => {
                      const slideRect = slideRef.current?.getBoundingClientRect();
                      if (!slideRect) {
                        return;
                      }

                      const rect = event.currentTarget.getBoundingClientRect();

                      if (element.type === 'text') {
                        const centerX = rect.left - slideRect.left + rect.width / 2;
                        const clampedX = Math.max(
                          TEXT_TOOLBAR_HALF_WIDTH,
                          Math.min(centerX, slideRect.width - TEXT_TOOLBAR_HALF_WIDTH)
                        );
                        const relativeTop = Math.max(
                          rect.top - slideRect.top - TEXT_TOOLBAR_VERTICAL_OFFSET,
                          8
                        );
                        setHoveredElement(element.id);
                        setToolbarPosition({
                          x: clampedX,
                          y: relativeTop
                        });
                        setShapeToolbarPosition(null);
                        return;
                      }

                      if (element.type === 'shape') {
                        const centerX = rect.left - slideRect.left + rect.width / 2;
                        const clampedX = Math.max(24, Math.min(centerX, slideRect.width - 24));
                        const relativeTop = Math.max(rect.top - slideRect.top, 0);
                        setHoveredElement(element.id);
                        setShapeToolbarPosition({
                          x: clampedX,
                          y: relativeTop
                        });
                        setToolbarPosition({ x: 0, y: 0 });
                      }
                    };

                    const handleWrapperLeave = (event) => {
                      if (element.type === 'text') {
                        if (selectedElement?.id === element.id) {
                          return;
                        }
                        const next = event?.relatedTarget;
                        if (next && typeof next.closest === 'function' && next.closest('.text-toolbar-wrapper')) {
                          return;
                        }
                        setHoveredElement((current) =>
                          current === element.id ? null : current
                        );
                        return;
                      }

                      if (element.type === 'shape') {
                        const next = event?.relatedTarget;
                        if (
                          next &&
                          typeof next.closest === 'function' &&
                          (next.closest('.shape-toolbar-wrapper') || next.closest('[data-shape-element="true"]'))
                        ) {
                          return;
                        }
                        setHoveredElement((current) => (current === element.id ? null : current));
                        setShapeToolbarPosition(null);
                      }
                    };

                    const numericX =
                      typeof element.x === 'number' && Number.isFinite(element.x)
                        ? element.x
                        : 0;
                    const numericY =
                      typeof element.y === 'number' && Number.isFinite(element.y)
                        ? element.y
                        : 0;
                    const chartConfig =
                      element.chartData ||
                      createDefaultChartData(element.chartType || 'bar');
                    const chartType =
                      chartConfig.type || element.chartType || 'bar';
                    const presetDimensions =
                      CHART_DIMENSIONS[chartType] || {};
                    const defaultChartWidth = presetDimensions.width || 360;
                    const defaultChartHeight = presetDimensions.height || 240;
                    const elementWidth =
                      typeof element.width === 'number' &&
                      Number.isFinite(element.width)
                        ? element.width
                        : element.type === 'chart'
                        ? defaultChartWidth
                        : element.type === 'text'
                        ? 320
                        : element.type === 'image'
                        ? 320
                        : 240;
                    const elementHeight =
                      typeof element.height === 'number' &&
                      Number.isFinite(element.height)
                        ? element.height
                        : element.type === 'text'
                        ? 80
                        : element.type === 'chart'
                        ? defaultChartHeight
                        : 160;
                    const minWidth =
                      element.type === 'text' ? MIN_TEXT_WIDTH : MIN_ELEMENT_SIZE;
                    const minHeight =
                      element.type === 'text'
                        ? MIN_TEXT_HEIGHT
                        : element.type === 'chart'
                        ? MIN_CHART_HEIGHT
                        : MIN_ELEMENT_SIZE;
                    const lockAspectRatio =
                      element.type === 'image' && element.maintainAspect
                        ? (Number.isFinite(element.aspectRatio)
                            ? element.aspectRatio
                            : true)
                        : false;
                    const disableDragging =
                      pendingInsert ||
                      (element.type === 'text' && editingTextId === element.id) ||
                      (element.type === 'image' && pendingInsert);
                    const enableResizing = pendingInsert
                      ? false
                      : {
                          top: true,
                          right: true,
                          bottom: true,
                          left: true,
                          topLeft: true,
                          topRight: true,
                          bottomLeft: true,
                          bottomRight: true
                        };

                    const renderContent = () => {
                      if (element.type === 'text') {
                        return (
                          <RichTextEditor
                            element={element}
                            isSelected={isSelected}
                            onContentChange={(html, plainText) => {
                              updateElement(element.id, { text: html, plainText });
                            }}
                            onFocus={() => {
                              setSelectedElement(element);
                              setHoveredElement(element.id);
                              setEditingTextId(element.id);
                              updateTextToolbarPosition(element.id);
                            }}
                            onBlur={() => {
                              setEditingTextId((current) =>
                                current === element.id ? null : current
                              );
                              setHoveredElement((current) =>
                                current === element.id ? null : current
                              );
                            }}
                          />
                        );
                      }

                      if (element.type === 'chart') {
                        return (
                          <div className="chart-element-content">
                            <ChartComponent
                              type={chartType}
                              data={{
                                labels: chartConfig.labels,
                                datasets: (chartConfig.datasets || []).map((dataset, index) => ({
                                  ...dataset,
                                  color: dataset.color || getPaletteColor(index)
                                }))
                              }}
                              options={{
                                plugins: {
                                  title: {
                                    display: !!chartConfig.title,
                                    text:
                                      chartConfig.title ||
                                      chartTypeLabels[chartType]
                                  }
                                }
                              }}
                              style={{
                                width: '100%',
                                height: '100%'
                              }}
                            />
                          </div>
                        );
                      }

                      if (element.type === 'shape') {
                        const baseStyle = {
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#ffffff'
                        };

                        if (element.shape === 'line') {
                          return (
                            <div
                              style={{
                                width: '100%',
                                height: `${element.strokeWidth || 2}px`,
                                backgroundColor: element.color || '#ffffff',
                                borderRadius: '999px'
                              }}
                            />
                          );
                        }

                        const shapeStyle = {
                          ...baseStyle,
                          backgroundColor: element.color || '#3b82f6',
                          borderRadius: element.shape === 'circle' ? '50%' : '18px',
                          clipPath:
                            element.shape === 'triangle'
                              ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                              : element.shape === 'arrow'
                              ? 'polygon(0% 40%, 70% 40%, 70% 20%, 100% 50%, 70% 80%, 70% 60%, 0% 60%)'
                              : element.shape === 'star'
                              ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                              : 'none'
                        };

                        return (
                          <div className="shape-element-content" style={shapeStyle}>
                            {element.text && element.shape !== 'line' && element.text}
                          </div>
                        );
                      }

                      if (element.type === 'image') {
                        return (
                          <div className="image-element-content">
                            <ImageComponent
                              element={element}
                              onUpdate={(updatedElement) => updateElement(element.id, updatedElement)}
                              onClose={() => setEditingImage(null)}
                              isEditing={editingImage === element.id}
                              onDelete={() => deleteElement(element.id)}
                              showDeleteButton={hoveredElement === element.id || selectedElement?.id === element.id}
                            />
                          </div>
                        );
                      }

                      return null;
                    };

                    return (
                      <Rnd
                        key={element.id}
                        className={`slide-element-wrapper ${element.type} ${isSelected ? 'selected' : ''}`}
                        data-shape-element={element.type === 'shape' ? 'true' : undefined}
                        innerRef={registerElementRef(element.id)}
                        bounds="parent"
                        size={{ width: elementWidth, height: elementHeight }}
                        position={{ x: numericX, y: numericY }}
                        minWidth={minWidth}
                        minHeight={minHeight}
                        lockAspectRatio={lockAspectRatio}
                        disableDragging={disableDragging}
                        enableResizing={enableResizing}
                        style={{ zIndex: isSelected ? 2 : 1 }}
                        onMouseDown={(event) => handleElementPointerDown(event, element)}
                        onClick={handleElementClick}
                        onMouseEnter={handleWrapperEnter}
                        onMouseLeave={handleWrapperLeave}
                        onDragStart={() => handleDragStart(element)}
                        onDragStop={(event, data) => handleDragStop(element, data)}
                        onResizeStart={() => handleResizeStart(element)}
                        onResizeStop={(event, direction, ref, delta, position) =>
                          handleResizeStop(element, direction, ref, position)
                        }
                      >
                        {renderContent()}
                        {isSelected &&
                          element.type !== 'chart' &&
                          element.type !== 'text' &&
                          element.type !== 'shape' &&
                          element.type !== 'image' && (
                          <div className="element-controls">
                            <button
                              type="button"
                              className="element-control-button delete"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteElement(element.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </Rnd>
                    );
                  })}

                  {selectedElement?.type === 'text' && (
                    <TextToolbar
                      element={selectedElement}
                      onUpdate={updateElement}
                      onDelete={deleteElement}
                      position={{ x: toolbarPosition.x, y: toolbarPosition.y }}
                      isVisible
                    />
                  )}

                  {shapeToolbarPosition && activeShapeElement && (
                    <ShapeToolbar
                      element={activeShapeElement}
                      onUpdate={updateElement}
                      onDelete={deleteElement}
                      position={shapeToolbarPosition}
                      isVisible
                      onDismiss={() => {
                        setShapeToolbarPosition(null);
                        setHoveredElement(null);
                      }}
                    />
                  )}

                  {chartToolbarPosition && selectedElement?.type === 'chart' && (
                    <ChartToolbar
                      element={selectedElement}
                      position={chartToolbarPosition}
                      isVisible
                      onChangeType={(id, type) => {
                        const currentChartData = selectedElement.chartData || {};
                        const defaultData = createDefaultChartData(type);
                        
                        // For columnLine, use default datasets to ensure proper variants
                        const updatedDatasets = type === 'columnLine' 
                          ? defaultData.datasets 
                          : currentChartData.datasets;
                        
                        updateElement(id, { 
                          chartType: type,
                          chartData: {
                            ...currentChartData,
                            type: type,
                            title: defaultData.title,
                            datasets: updatedDatasets
                          }
                        });
                      }}
                      onEditData={() => setChartEditorId(selectedElement.id)}
                      onDelete={() => deleteElement(selectedElement.id)}
                      onDismiss={() => {
                        setChartToolbarPosition(null);
                        setHoveredElement(null);
                      }}
                    />
                  )}

                  {pendingInsert && (
                    <div className="insert-hint">
                      Click on the slide to add {describeInsertTarget(pendingInsert)}.
                      {keepInsertEnabled
                        ? ' Press Esc to stop inserting.'
                        : ' Press Esc to cancel.'}
                    </div>
                  )}

                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageFileChange}
                />
              </div>
            </main>
          </div>
        ) : (
          <div className="slideshow">
            <div className="slideshow-header">
              <div className="slideshow-info">
                <span className="slide-counter">{currentSlideIndex + 1} / {slides.length}</span>
                <span className="slideshow-title">Presentation Mode</span>
              </div>
              <div className="slideshow-actions">
                <button 
                  className="slideshow-btn exit"
                  onClick={() => setIsSlideshow(false)}
                  title="Exit Slideshow (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="slideshow-content">
              <div className="slide" style={{ backgroundColor: currentSlide.background?.color || DEFAULT_BACKGROUND }}>
                {currentSlide.content?.map((element) => {
                  if (element.type === 'text') {
                    return (
                      <div
                        key={element.id}
                        className="slide-element"
                        style={{
                          position: 'absolute',
                          left: `${element.x}px`,
                          top: `${element.y}px`,
                          width: `${element.width}px`,
                          height: `${element.height}px`,
                          fontSize: `${element.fontSize}px`,
                          color: element.color,
                          fontFamily: element.fontFamily,
                          textAlign: element.textAlign || 'left',
                          fontWeight: element.fontWeight || 'normal',
                          fontStyle: element.italic ? 'italic' : 'normal',
                          textDecoration: element.underline ? 'underline' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: element.textAlign === 'center' ? 'center' : 'flex-start'
                        }}
                        dangerouslySetInnerHTML={{ __html: element.text || '' }}
                      />
                    );
                  } else if (element.type === 'shape') {
                    const getShapeStyle = () => {
                      const baseStyle = {
                        position: 'absolute',
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        backgroundColor: element.color || '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500'
                      };

                      switch (element.shape) {
                        case 'circle':
                          return { ...baseStyle, borderRadius: '50%' };
                        case 'triangle':
                          return {
                            ...baseStyle,
                            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                          };
                        case 'arrow':
                          return {
                            ...baseStyle,
                            clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)'
                          };
                        case 'star':
                          return {
                            ...baseStyle,
                            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                          };
                        case 'line':
                          return {
                            ...baseStyle,
                            backgroundColor: element.color || '#ffffff',
                            borderRadius: '0',
                            height: `${element.strokeWidth || 2}px`,
                            width: `${element.width}px`
                          };
                        default:
                          return { ...baseStyle, borderRadius: '8px' };
                      }
                    };

                    return (
                      <div 
                        key={element.id}
                        className="slide-element"
                        style={getShapeStyle()}
                      >
                        {element.text && element.shape !== 'line' && element.text}
                      </div>
                    );
                  } else if (element.type === 'chart') {
                    const chartData = element.chartData || createDefaultChartData(element.chartType || 'bar');
                    return (
                      <div
                        key={element.id}
                        style={{
                          position: 'absolute',
                          left: `${element.x}px`,
                          top: `${element.y}px`,
                          width: `${element.width}px`,
                          height: `${element.height}px`
                        }}
                      >
                        <ChartComponent
                          type={chartData.type || element.chartType || 'bar'}
                          data={{
                            labels: chartData.labels,
                            datasets: (chartData.datasets || []).map((dataset, index) => ({
                              ...dataset,
                              color: dataset.color || getPaletteColor(index)
                            }))
                          }}
                          options={{
                            plugins: {
                              title: {
                                display: !!chartData.title,
                                text: chartData.title || chartTypeLabels[chartData.type || element.chartType || 'bar']
                              }
                            }
                          }}
                        />
                      </div>
                    );
                  } else if (element.type === 'image' && element.src) {
                    return (
                      <div
                        key={element.id}
                        style={{
                          position: 'absolute',
                          left: `${element.x}px`,
                          top: `${element.y}px`,
                          width: `${element.width}px`,
                          height: `${element.height}px`,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px'
                        }}
                      >
                        <img
                          src={element.src}
                          alt=""
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="slideshow-footer">
              <div className="slide-navigation">
                <button 
                  className="nav-btn"
                  onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                >
                  ⬅️ Previous
                </button>
                <button 
                  className="nav-btn"
                  onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                >
                  Next ➡️
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {chartEditorElement && (
        <ChartDataEditor
          isOpen
          data={chartEditorElement.chartData || createDefaultChartData(chartEditorElement.chartType || 'bar')}
          chartTypeLabels={chartTypeLabels}
          palette={CHART_COLOR_PALETTE}
          onClose={closeChartEditor}
          onSave={handleChartEditorSave}
        />
      )}
    </>
  );
};

export default PresentationApp;
