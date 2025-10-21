// src/components/PresentationApp.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './PresentationApp.css';
import ChartComponent from './ChartComponent';
import ChartDataEditor from './ChartDataEditor';
import ImageComponent from './ImageComponent';
import RichTextEditor from './RichTextEditor';

import SlidePanel from './SlidePanel';
import EnhancedToolbar from './EnhancedToolbar';
import { createSlideFromLayout } from '../data/slideLayouts';
import { exportSlidesAsPptx } from '../utils/pptxExport';

const DEFAULT_BACKGROUND = '#ffffff';
const TEXT_TOOLBAR_HALF_WIDTH = 280;

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
  const [editingImage, setEditingImage] = useState(null);
  const [chartEditorId, setChartEditorId] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
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
  const dragStateRef = useRef(null);
  const resizeStateRef = useRef(null);

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
    if (editingImage === elementId) {
      setEditingImage(null);
    }
    setChartEditorId((current) => (current === elementId ? null : current));
  }, [currentSlideIndex, editingImage]);

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

  const hoveredTextElement = useMemo(() => {
    if (!hoveredElement) {
      return null;
    }
    return (
      currentSlide.content?.find(
        (item) => item.id === hoveredElement && item.type === 'text'
      ) || null
    );
  }, [currentSlide, hoveredElement]);

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

  const startDrag = useCallback((event, element) => {
    if (pendingInsert || event.button !== 0) {
      return;
    }

    if (element.type === 'text' && event.target.closest('[data-text-editable="true"]')) {
      return;
    }

    const slideNode = slideRef.current;
    if (!slideNode) {
      return;
    }

    const wrapperNode = event.currentTarget.closest('.slide-element-wrapper');
    if (!wrapperNode) {
      return;
    }

    const rect = slideNode.getBoundingClientRect();
    const wrapperRect = wrapperNode.getBoundingClientRect();
    dragStateRef.current = {
      id: element.id,
      offsetX: event.clientX - wrapperRect.left,
      offsetY: event.clientY - wrapperRect.top,
      width: wrapperRect.width,
      height: wrapperRect.height
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    setSelectedElement(element);
    if (element.type === 'text') {
      setHoveredElement(element.id);
      const centerX = wrapperRect.left - rect.left + wrapperRect.width / 2;
      const clampedX = Math.max(
        TEXT_TOOLBAR_HALF_WIDTH,
        Math.min(centerX, rect.width - TEXT_TOOLBAR_HALF_WIDTH)
      );
      const relativeTop = Math.max(wrapperRect.top - rect.top, 0);
      setToolbarPosition({
        x: clampedX,
        y: relativeTop
      });
    }
  }, [pendingInsert]);

  const startResize = useCallback((event, element) => {
    if (pendingInsert || event.button !== 0) {
      return;
    }
    event.stopPropagation();
    const slideNode = slideRef.current;
    if (!slideNode) {
      return;
    }

    const slideRect = slideNode.getBoundingClientRect();
    const wrapperRect = event.currentTarget.parentElement?.getBoundingClientRect();
    const startWidth = element.width || wrapperRect?.width || 0;
    const startHeight = element.height || wrapperRect?.height || 0;

    resizeStateRef.current = {
      id: element.id,
      type: element.type,
      startX: event.clientX,
      startY: event.clientY,
      startWidth,
      startHeight,
      originX: element.x || 0,
      originY: element.y || 0,
      minWidth: element.type === 'text' ? 120 : 60,
      minHeight: element.type === 'text' ? 40 : 60,
      slideWidth: slideRect.width,
      slideHeight: slideRect.height
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
  }, [pendingInsert]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const resizeState = resizeStateRef.current;
      if (resizeState) {
        const slideNode = slideRef.current;
        if (!slideNode) {
          return;
        }

        const deltaX = event.clientX - resizeState.startX;
        const deltaY = event.clientY - resizeState.startY;

        const maxWidth = Math.max(
          resizeState.slideWidth - resizeState.originX,
          resizeState.minWidth
        );
        const maxHeight = Math.max(
          resizeState.slideHeight - resizeState.originY,
          resizeState.minHeight
        );

        const nextWidth = Math.min(
          Math.max(resizeState.startWidth + deltaX, resizeState.minWidth),
          maxWidth
        );
        const nextHeight = Math.min(
          Math.max(resizeState.startHeight + deltaY, resizeState.minHeight),
          maxHeight
        );

        if (resizeState.type === 'text') {
          updateElement(resizeState.id, { width: Math.round(nextWidth) });

          if (selectedElement?.id === resizeState.id) {
            const centerX = Math.max(
              TEXT_TOOLBAR_HALF_WIDTH,
              Math.min(
                resizeState.originX + nextWidth / 2,
                resizeState.slideWidth - TEXT_TOOLBAR_HALF_WIDTH
              )
            );
            const toolbarTop = Math.max(resizeState.originY, 24);
            setToolbarPosition({ x: centerX, y: toolbarTop });
          }
        } else if (resizeState.type === 'line') {
          updateElement(resizeState.id, {
            width: Math.round(nextWidth),
            strokeWidth: Math.max(1, Math.round(nextHeight))
          });
        } else {
          updateElement(resizeState.id, {
            width: Math.round(nextWidth),
            height: Math.round(nextHeight)
          });
        }

        event.preventDefault();
        return;
      }

      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }
      const slideNode = slideRef.current;
      if (!slideNode) {
        return;
      }

      const rect = slideNode.getBoundingClientRect();
      const width = dragState.width || 0;
      const height = dragState.height || 0;

      let nextX = event.clientX - rect.left - dragState.offsetX;
      let nextY = event.clientY - rect.top - dragState.offsetY;

      const maxX = width ? Math.max(rect.width - width, 0) : rect.width;
      const maxY = height ? Math.max(rect.height - height, 0) : rect.height;

      nextX = Math.max(0, Math.min(nextX, maxX));
      nextY = Math.max(0, Math.min(nextY, maxY));

      updateElement(dragState.id, { x: Math.round(nextX), y: Math.round(nextY) });
      if (selectedElement?.id === dragState.id && selectedElement?.type === 'text') {
        const centerX = nextX + (dragState.width || 0) / 2;
        const clampedX = Math.max(
          TEXT_TOOLBAR_HALF_WIDTH,
          Math.min(centerX, rect.width - TEXT_TOOLBAR_HALF_WIDTH)
        );
        const clampedY = Math.max(nextY, 0);
        setToolbarPosition({
          x: clampedX,
          y: clampedY
        });
      }
      event.preventDefault();
    };

    const handleMouseUp = () => {
      if (dragStateRef.current) {
        dragStateRef.current = null;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
      if (resizeStateRef.current) {
        resizeStateRef.current = null;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updateElement, selectedElement]);

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

  const addElement = (type, subtype = null) => {
    if (type === 'text') {
      const defaultTextColor = isDarkHexColor(activeSlideBackground) ? '#f5f5f5' : '#111111';
      const newElement = {
        id: `element-${Date.now()}`,
        type: 'text',
        x: 120,
        y: 120,
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
      setPendingInsert(null);
      setPendingInsertPos(null);
      setActiveDropdown(null);
      return;
    }

    setPendingInsert({ type, subtype: subtype || null });
    setPendingInsertPos(null);
    setActiveDropdown(null);
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
          color: '#3b82f6',
          borderColor: '#3b82f6',
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
      const imageData = event.target.result;
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
          src: imageData,
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
      img.src = imageData;
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
                          const relativeTop = Math.max(rect.top - slideRect.top, 0);
                          setHoveredElement(element.id);
                          setToolbarPosition({
                            x: clampedX,
                            y: relativeTop
                          });
                        }
                      }
                      if (element.type === 'image') {
                        setEditingImage(element.id);
                      }
                    };

                    const handleWrapperEnter = (event) => {
                      if (element.type !== 'text') {
                        return;
                      }
                      const rect = event.currentTarget.getBoundingClientRect();
                      const slideRect = slideRef.current?.getBoundingClientRect();
                      if (slideRect) {
                        const centerX = rect.left - slideRect.left + rect.width / 2;
                        const clampedX = Math.max(
                          TEXT_TOOLBAR_HALF_WIDTH,
                          Math.min(centerX, slideRect.width - TEXT_TOOLBAR_HALF_WIDTH)
                        );
                        const relativeTop = Math.max(rect.top - slideRect.top, 0);
                        setHoveredElement(element.id);
                        setToolbarPosition({
                          x: clampedX,
                          y: relativeTop
                        });
                      }
                    };

                    const handleWrapperLeave = () => {
                      if (element.type !== 'text') {
                        return;
                      }
                      if (selectedElement?.id === element.id) {
                        return;
                      }
                      setHoveredElement(null);
                    };

                    const wrapperStyle = {
                      position: 'absolute',
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      width: element.width ? `${element.width}px` : 'auto',
                      height: element.height ? `${element.height}px` : 'auto',
                      zIndex: isSelected ? 2 : 1
                    };

                    if (element.type === 'text') {
                      wrapperStyle.height = 'auto';
                    }

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
                            }}
                            onBlur={() => {
                              setHoveredElement((current) => (current === element.id ? null : current));
                            }}
                          />
                        );
                      }

                      if (element.type === 'chart') {
                        const chartData = element.chartData || createDefaultChartData('bar');
                        const presetDimensions = CHART_DIMENSIONS[element.chartData?.type || element.chartType || 'bar'] || {};
                        const chartWidth = element.width || presetDimensions.width || 360;
                        const chartHeight = element.height || presetDimensions.height || 240;

                        return (
                          <div className="chart-element-content">
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
                              style={{
                                width: `${chartWidth}px`,
                                height: `${chartHeight}px`
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
                            />
                          </div>
                        );
                      }

                      return null;
                    };

                    return (
                      <div
                        key={element.id}
                        className={`slide-element-wrapper ${element.type} ${isSelected ? 'selected' : ''}`}
                        style={wrapperStyle}
                        onMouseDown={(e) => startDrag(e, element)}
                        onClick={handleElementClick}
                        onMouseEnter={handleWrapperEnter}
                        onMouseLeave={handleWrapperLeave}
                      >
                        {element.type === 'text' && (
                        <button
                          type="button"
                          className="text-drag-handle"
                          onMouseDown={(event) => startDrag(event, element)}
                          aria-label="Drag text element"
                        >
                          ⠿
                        </button>
                      )}
                      {renderContent()}
                        {isSelected && element.type === 'chart' && (
                          <div className="element-controls">
                            <button
                              type="button"
                              className="element-control-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setChartEditorId(element.id);
                              }}
                            >
                              Edit Data
                            </button>
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
                        {isSelected && element.type !== 'chart' && element.type !== 'text' && (
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
                        {isSelected && element.type !== 'line' && (
                          <button
                            type="button"
                            className="resize-handle"
                            onMouseDown={(e) => startResize(e, element)}
                            aria-label="Resize element"
                            tabIndex={-1}
                          />
                        )}
                      </div>
                    );
                  })}

                  {pendingInsert && (
                    <div className="insert-hint">
                      Click on the slide to add {describeInsertTarget(pendingInsert)}.
                      {keepInsertEnabled
                        ? ' Press Esc to stop inserting.'
                        : ' Press Esc to cancel.'}
                    </div>
                  )}

                  {/* Text toolbar removed in favor of TipTap bubble menu */}
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
                      >
                        {element.text}
                      </div>
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
                            backgroundColor: 'transparent',
                            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                          };
                        case 'arrow':
                          return {
                            ...baseStyle,
                            backgroundColor: 'transparent',
                            clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)'
                          };
                        case 'star':
                          return {
                            ...baseStyle,
                            backgroundColor: 'transparent',
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
