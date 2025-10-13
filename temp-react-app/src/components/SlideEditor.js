import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import './SlideEditor.css';

const TEXT_STYLES = {
  heading: { label: 'Heading', fontSize: 56, fontWeight: 600 },
  title: { label: 'Title', fontSize: 40, fontWeight: 500 },
  paragraph: { label: 'Paragraph', fontSize: 20, fontWeight: 400 }
};

const FONT_FAMILIES = [
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Playfair Display", serif', label: 'Playfair Display' },
  { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro' },
  { value: 'Arial, sans-serif', label: 'Arial' }
];

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' }
];

const CHART_TYPES = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' }
];

const PIE_COLORS = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#c084fc', '#f472b6'];
const MAX_IMAGE_CANVAS_RATIO = 0.72;
const DEFAULT_BACKGROUND = '#050505';
const MIN_TEXT_WIDTH = 120;
const MIN_ELEMENT_SIZE = 60;
const MIN_CHART_HEIGHT = 120;

const hexToRgba = (hex, alpha = 1) => {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) {
    return hex;
  }
  const value = parseInt(sanitized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const createChartPoint = (label, value) => ({
  id: `chart-point-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  label,
  value
});

const SlideEditor = ({
  slide,
  updateSlide,
  insertAction,
  onInsertActionHandled
}) => {
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [isAddingShape, setIsAddingShape] = useState(false);
  const [isAddingChart, setIsAddingChart] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const [shapeToolbarPosition, setShapeToolbarPosition] = useState(null);
  const [chartToolbarPosition, setChartToolbarPosition] = useState(null);

  const canvasRef = useRef(null);
  const elementRefs = useRef({});
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageActionRef = useRef(null);

  const currentBackground = slide.background || DEFAULT_BACKGROUND;

  const selectedElement = useMemo(
    () => slide.content.find((item) => item.id === selectedElementId) || null,
    [slide.content, selectedElementId]
  );

  useEffect(() => {
    if (!selectedElement) {
      return;
    }

    if (!slide.content.some((item) => item.id === selectedElement.id)) {
      setSelectedElementId(null);
    }
  }, [slide.content, selectedElement]);

  const registerElementRef = (id) => (node) => {
    if (node) {
      elementRefs.current[id] = node;
    } else {
      delete elementRefs.current[id];
    }
  };

  const addTextBox = useCallback(
    (x, y) => {
      const newTextBox = {
        id: Date.now(),
        type: 'text',
        text: 'Click to edit text',
        x: Math.max(32, x - 120),
        y: Math.max(32, y - 30),
        width: 240,
        fontSize: TEXT_STYLES.paragraph.fontSize,
        fontFamily: 'Georgia, serif',
        fontWeight: TEXT_STYLES.paragraph.fontWeight,
        textStyle: 'paragraph',
        color: '#f5f5f5',
        textAlign: 'left',
        bold: false,
        italic: false,
        underline: false
      };

      updateSlide({
        ...slide,
        content: [...slide.content, newTextBox]
      });
      setSelectedElementId(newTextBox.id);
      setIsAddingText(false);
      setIsAddingShape(false);
      setIsAddingChart(false);
    },
    [slide, updateSlide]
  );

  const addShape = useCallback(
    (x, y) => {
      const newShape = {
        id: Date.now(),
        type: 'shape',
        shape: 'rectangle',
        x: Math.max(32, x - 60),
        y: Math.max(32, y - 30),
        width: 120,
        height: 60,
        color: '#1a73e8',
        borderColor: '#1a73e8',
        borderWidth: 2
      };

      updateSlide({
        ...slide,
        content: [...slide.content, newShape]
      });
      setSelectedElementId(newShape.id);
      setIsAddingShape(false);
      setIsAddingText(false);
      setIsAddingChart(false);
    },
    [slide, updateSlide]
  );

  const addChart = useCallback(
    (x, y) => {
      const newChart = {
        id: Date.now(),
        type: 'chart',
        chartType: 'bar',
        x: Math.max(32, x - 120),
        y: Math.max(32, y - 80),
        width: 260,
        height: 180,
        accentColor: '#1a73e8',
        background: hexToRgba('#1a73e8', 0.12),
        data: [
          createChartPoint('Category A', 40),
          createChartPoint('Category B', 60),
          createChartPoint('Category C', 30)
        ]
      };

      updateSlide({
        ...slide,
        content: [...slide.content, newChart]
      });
      setSelectedElementId(newChart.id);
      setIsAddingChart(false);
      setIsAddingShape(false);
      setIsAddingText(false);
    },
    [slide, updateSlide]
  );

  const updateElement = useCallback(
    (elementId, updates) => {
      const updatedContent = slide.content.map((item) =>
        item.id === elementId ? { ...item, ...updates } : item
      );
      updateSlide({ ...slide, content: updatedContent });
    },
    [slide, updateSlide]
  );

  const addImageElement = useCallback(
    (src, naturalWidth, naturalHeight, altText) => {
      if (!src) {
        return;
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      let width = naturalWidth || 320;
      let height = naturalHeight || 200;

      if (canvasRect && naturalWidth && naturalHeight) {
        const widthScale =
          (canvasRect.width * MAX_IMAGE_CANVAS_RATIO) / naturalWidth;
        const heightScale =
          (canvasRect.height * MAX_IMAGE_CANVAS_RATIO) / naturalHeight;
        const scale = Math.min(widthScale, heightScale, 1);
        width = Math.max(64, naturalWidth * scale);
        height = Math.max(64, naturalHeight * scale);
      } else if (canvasRect) {
        width = Math.min(width, canvasRect.width * MAX_IMAGE_CANVAS_RATIO);
        height = Math.min(height, canvasRect.height * MAX_IMAGE_CANVAS_RATIO);
      }

      const aspectRatio =
        naturalWidth && naturalHeight && naturalHeight !== 0
          ? naturalWidth / naturalHeight
          : width / Math.max(height, 1);

      let x = canvasRect ? (canvasRect.width - width) / 2 : 160;
      let y = canvasRect ? (canvasRect.height - height) / 2 : 120;

      if (canvasRect) {
        x = Math.max(0, Math.min(x, canvasRect.width - width));
        y = Math.max(0, Math.min(y, canvasRect.height - height));
      }

      const newImage = {
        id: Date.now(),
        type: 'image',
        src,
        x,
        y,
        width,
        height,
        aspectRatio,
        alt: altText || 'Inserted image'
      };

      updateSlide({
        ...slide,
        content: [...slide.content, newImage]
      });
      setSelectedElementId(newImage.id);
    },
    [canvasRef, slide, updateSlide]
  );

  const replaceImageElement = useCallback(
    (elementId, src, naturalWidth, naturalHeight, altText) => {
      if (!src) {
        return;
      }

      const target = slide.content.find(
        (item) => item.id === elementId && item.type === 'image'
      );
      if (!target) {
        return;
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      let width = target.width || 240;
      let height = target.height || 160;

      if (canvasRect && naturalWidth && naturalHeight) {
        const widthScale =
          (canvasRect.width * MAX_IMAGE_CANVAS_RATIO) / naturalWidth;
        const heightScale =
          (canvasRect.height * MAX_IMAGE_CANVAS_RATIO) / naturalHeight;
        const scale = Math.min(widthScale, heightScale, 1);
        width = Math.max(64, naturalWidth * scale);
        height = Math.max(64, naturalHeight * scale);
      } else if (naturalWidth && naturalHeight) {
        width = naturalWidth;
        height = naturalHeight;
      }

      if (canvasRect) {
        width = Math.min(width, canvasRect.width);
        height = Math.min(height, canvasRect.height);
      }

      const aspectRatio =
        naturalWidth && naturalHeight && naturalHeight !== 0
          ? naturalWidth / naturalHeight
          : target.aspectRatio || width / Math.max(height, 1);

      let x = target.x;
      let y = target.y;

      if (canvasRect) {
        x = Math.max(0, Math.min(x, canvasRect.width - width));
        y = Math.max(0, Math.min(y, canvasRect.height - height));
      }

      updateElement(elementId, {
        src,
        width,
        height,
        x,
        y,
        aspectRatio,
        alt: altText || target.alt || 'Image'
      });
      setSelectedElementId(elementId);
    },
    [canvasRef, slide.content, updateElement]
  );

  const updateImageDimensions = useCallback(
    (elementId, width, height) => {
      const target = slide.content.find(
        (item) => item.id === elementId && item.type === 'image'
      );
      if (!target) {
        return;
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      let nextWidth = Math.max(40, Number(width));
      let nextHeight = Math.max(40, Number(height));

      if (canvasRect) {
        nextWidth = Math.min(nextWidth, canvasRect.width);
        nextHeight = Math.min(nextHeight, canvasRect.height);
      }

      let nextX = target.x;
      let nextY = target.y;

      if (canvasRect) {
        nextX = Math.max(0, Math.min(nextX, canvasRect.width - nextWidth));
        nextY = Math.max(0, Math.min(nextY, canvasRect.height - nextHeight));
      }

      updateElement(elementId, {
        width: nextWidth,
        height: nextHeight,
        x: nextX,
        y: nextY
      });
    },
    [canvasRef, slide.content, updateElement]
  );

  const openImagePicker = useCallback(
    (action) => {
      imageActionRef.current = action;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    },
    [fileInputRef]
  );

  const handleImageInputChange = useCallback(
    (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        imageActionRef.current = null;
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          imageActionRef.current = null;
          return;
        }

        const action = imageActionRef.current;
        const image = new Image();
        image.onload = () => {
          if (action && action !== 'new') {
            replaceImageElement(
              action,
              result,
              image.naturalWidth,
              image.naturalHeight,
              file.name
            );
          } else {
            addImageElement(
              result,
              image.naturalWidth,
              image.naturalHeight,
              file.name
            );
          }
          imageActionRef.current = null;
        };
        image.onerror = () => {
          if (action && action !== 'new') {
            replaceImageElement(action, result, null, null, file.name);
          } else {
            addImageElement(result, null, null, file.name);
          }
          imageActionRef.current = null;
        };
        image.src = result;
      };
      reader.onerror = () => {
        imageActionRef.current = null;
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addImageElement, replaceImageElement, fileInputRef]
  );

  const deleteElement = useCallback(
    (elementId) => {
      const updatedContent = slide.content.filter((item) => item.id !== elementId);
      updateSlide({ ...slide, content: updatedContent });
      setSelectedElementId(null);
    },
    [slide, updateSlide]
  );

  const handleCanvasClick = useCallback(
    (event) => {
      // Ignore clicks within floating toolbars or property panels
      if (
        event.target.closest('.text-floating-toolbar') ||
        event.target.closest('.shape-floating-toolbar') ||
        event.target.closest('.chart-floating-toolbar') ||
        event.target.closest('.element-properties')
      ) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (isAddingText) {
        addTextBox(x, y);
        return;
      }

      if (isAddingShape) {
        addShape(x, y);
        return;
      }

      if (isAddingChart) {
        addChart(x, y);
        return;
      }

      setSelectedElementId(null);
    },
    [addChart, addShape, addTextBox, isAddingChart, isAddingShape, isAddingText]
  );

  const handleElementClick = (event, element) => {
    event.stopPropagation();
    if (selectedElementId === element.id) {
      const node = elementRefs.current[element.id];
      if (node) {
        node.focus();
      }
    } else {
      setSelectedElementId(element.id);
    }
  };

  const handleElementMouseDown = (event, element) => {
    event.stopPropagation();
    setSelectedElementId(element.id);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) {
      return;
    }

    dragRef.current = {
      id: element.id,
      offsetX: event.clientX - canvasRect.left - element.x,
      offsetY: event.clientY - canvasRect.top - element.y,
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false
    };
  };

  const handleResizeMouseDown = (event, element) => {
    event.stopPropagation();
    event.preventDefault();
    setSelectedElementId(element.id);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const elementNode = elementRefs.current[element.id];
    if (!canvasRect || !elementNode) {
      return;
    }

    const currentWidth =
      typeof element.width === 'number' && element.width > 0
        ? element.width
        : elementNode.offsetWidth;
    const currentHeight =
      typeof element.height === 'number' && element.height > 0
        ? element.height
        : elementNode.offsetHeight;

    resizeRef.current = {
      id: element.id,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: currentWidth,
      startHeight: currentHeight,
      startLeft: element.x,
      startTop: element.y,
      type: element.type,
      aspectRatio:
        element.type === 'image' && element.aspectRatio
          ? element.aspectRatio
          : element.type === 'image' && currentHeight > 0
          ? currentWidth / currentHeight
          : null
    };

    dragRef.current = null;
  };

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (resizeRef.current) {
        const {
          id,
          startX,
          startY,
          startWidth,
          startHeight,
          startLeft,
          startTop,
          type,
          aspectRatio
        } = resizeRef.current;
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) {
          return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        const maxWidth = canvasRect.width - startLeft;
        const maxHeight = canvasRect.height - startTop;

        let newWidth = Math.min(Math.max(startWidth + deltaX, MIN_ELEMENT_SIZE), maxWidth);
        let newHeight = startHeight;

        if (type === 'text') {
          newWidth = Math.min(Math.max(startWidth + deltaX, MIN_TEXT_WIDTH), maxWidth);
        } else if (type === 'image') {
          if (aspectRatio && !event.shiftKey) {
            const candidateWidth = startWidth + deltaX;
            const candidateHeight = startHeight + deltaY;
            const widthDrivenHeight = candidateWidth / aspectRatio;
            const heightDrivenWidth = candidateHeight * aspectRatio;
            if (widthDrivenHeight >= MIN_ELEMENT_SIZE && widthDrivenHeight <= maxHeight) {
              newWidth = Math.min(Math.max(candidateWidth, MIN_ELEMENT_SIZE), maxWidth);
              newHeight = Math.min(Math.max(widthDrivenHeight, MIN_ELEMENT_SIZE), maxHeight);
            } else {
              newHeight = Math.min(Math.max(candidateHeight, MIN_ELEMENT_SIZE), maxHeight);
              newWidth = Math.min(Math.max(heightDrivenWidth, MIN_ELEMENT_SIZE), maxWidth);
            }
          } else {
            newHeight = Math.min(Math.max(startHeight + deltaY, MIN_ELEMENT_SIZE), maxHeight);
          }
        } else {
          const minHeight = type === 'chart' ? MIN_CHART_HEIGHT : MIN_ELEMENT_SIZE;
          newHeight = Math.min(Math.max(startHeight + deltaY, minHeight), maxHeight);
        }

        const updates = {};
        if (type === 'text') {
          updates.width = Math.round(newWidth);
        } else if (type === 'shape') {
          updates.width = Math.round(newWidth);
          updates.height = Math.round(newHeight);
        } else if (type === 'image') {
          updates.width = Math.round(newWidth);
          updates.height = Math.round(newHeight);
        } else if (type === 'chart') {
          updates.width = Math.round(newWidth);
          updates.height = Math.round(newHeight);
        }

        updateElement(id, updates);
        event.preventDefault();
        return;
      }

      if (!dragRef.current) {
        return;
      }

      const { id, offsetX, offsetY, startX, startY, isDragging } = dragRef.current;
      const deltaX = Math.abs(event.clientX - startX);
      const deltaY = Math.abs(event.clientY - startY);

      if (!isDragging && deltaX < 3 && deltaY < 3) {
        return;
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) {
        return;
      }

      dragRef.current.isDragging = true;
      event.preventDefault();

      const elementNode = elementRefs.current[id];
      const elementWidth = elementNode ? elementNode.offsetWidth : 0;
      const elementHeight = elementNode ? elementNode.offsetHeight : 0;

      const x = event.clientX - canvasRect.left - offsetX;
      const y = event.clientY - canvasRect.top - offsetY;

      const clampedX = Math.max(
        0,
        Math.min(canvasRect.width - elementWidth, x)
      );
      const clampedY = Math.max(
        0,
        Math.min(canvasRect.height - elementHeight, y)
      );

      updateElement(id, { x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updateElement]);

  useEffect(() => {
    if (!insertAction) {
      return;
    }

    if (insertAction === 'addText') {
      setIsAddingText(true);
      setIsAddingShape(false);
      setIsAddingChart(false);
    } else if (insertAction === 'addShape') {
      setIsAddingShape(true);
      setIsAddingText(false);
      setIsAddingChart(false);
    } else if (insertAction === 'addImage') {
      setIsAddingText(false);
      setIsAddingShape(false);
      setIsAddingChart(false);
      openImagePicker('new');
    } else if (insertAction === 'addChart') {
      setIsAddingChart(true);
      setIsAddingShape(false);
      setIsAddingText(false);
    } else {
      setIsAddingText(false);
      setIsAddingShape(false);
      setIsAddingChart(false);
    }

    if (typeof onInsertActionHandled === 'function') {
      onInsertActionHandled();
    }
  }, [insertAction, onInsertActionHandled, openImagePicker]);

  useEffect(() => {
    if (!selectedElement) {
      setToolbarPosition(null);
      setShapeToolbarPosition(null);
      setChartToolbarPosition(null);
      return;
    }

    const updateToolbar = () => {
      const elementNode = elementRefs.current[selectedElement.id];
      const canvasNode = canvasRef.current;

      if (!elementNode || !canvasNode) {
        setToolbarPosition(null);
        setShapeToolbarPosition(null);
        setChartToolbarPosition(null);
        return;
      }

      const elementRect = elementNode.getBoundingClientRect();
      const canvasRect = canvasNode.getBoundingClientRect();

      const baseTop = elementRect.top - canvasRect.top - 64;
      const baseLeft =
        elementRect.left - canvasRect.left + elementRect.width / 2;

      const clamped = {
        top: Math.max(16, baseTop),
        left: baseLeft
      };

      if (selectedElement.type === 'text') {
        setToolbarPosition(clamped);
        setShapeToolbarPosition(null);
        setChartToolbarPosition(null);
      } else if (selectedElement.type === 'shape') {
        setShapeToolbarPosition(clamped);
        setToolbarPosition(null);
        setChartToolbarPosition(null);
      } else if (selectedElement.type === 'chart') {
        setChartToolbarPosition(clamped);
        setToolbarPosition(null);
        setShapeToolbarPosition(null);
      }
    };

    updateToolbar();
    window.addEventListener('resize', updateToolbar);
    return () => window.removeEventListener('resize', updateToolbar);
  }, [selectedElement, slide.content]);

  const handleTextStyleChange = (styleKey) => {
    const style = TEXT_STYLES[styleKey];
    if (!style || !selectedElement || selectedElement.type !== 'text') {
      return;
    }

    updateElement(selectedElement.id, {
      textStyle: styleKey,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight
    });
  };

  const handleFontSizeChange = (value) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      return;
    }

    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }

    updateElement(selectedElement.id, { fontSize: parsed });
  };

  const handleFontFamilyChange = (value) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      return;
    }
    updateElement(selectedElement.id, { fontFamily: value });
  };

  const handleColorChange = (value) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      return;
    }
    updateElement(selectedElement.id, { color: value });
  };

  const handleAlignmentChange = (value) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      return;
    }
    updateElement(selectedElement.id, { textAlign: value });
  };

  const handleToggleFormat = (key) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      return;
    }
    updateElement(selectedElement.id, { [key]: !selectedElement[key] });
  };

  const handleAddChartPoint = useCallback(() => {
    if (!selectedElement || selectedElement.type !== 'chart') {
      return;
    }
    const nextIndex = (selectedElement.data?.length || 0) + 1;
    const newData = [
      ...(selectedElement.data || []),
      createChartPoint(`Item ${nextIndex}`, 10)
    ];
    updateElement(selectedElement.id, { data: newData });
  }, [selectedElement, updateElement]);

  const handleUpdateChartPoint = useCallback(
    (pointId, updates) => {
      if (!selectedElement || selectedElement.type !== 'chart') {
        return;
      }
      const newData = (selectedElement.data || []).map((point) =>
        point.id === pointId ? { ...point, ...updates } : point
      );
      updateElement(selectedElement.id, { data: newData });
    },
    [selectedElement, updateElement]
  );

  const handleRemoveChartPoint = useCallback(
    (pointId) => {
      if (!selectedElement || selectedElement.type !== 'chart') {
        return;
      }
      const currentData = selectedElement.data || [];
      if (currentData.length <= 1) {
        return;
      }
      const newData = currentData.filter((point) => point.id !== pointId);
      updateElement(selectedElement.id, { data: newData });
    },
    [selectedElement, updateElement]
  );

  const handleTextBlur = (event, element) => {
    const text = event.target.textContent || '';
    updateElement(element.id, { text });
  };

  const renderChartVisual = (chart) => {
    const data = chart.data && chart.data.length ? chart.data : [];
    if (!data.length) {
      return (
        <div className="chart-empty">Add data rows to populate this chart.</div>
      );
    }

    const accentColor = chart.accentColor || '#1a73e8';
    const maxValue = Math.max(...data.map((point) => point.value || 0), 1);

    if (chart.chartType === 'pie') {
      const total = Math.max(
        data.reduce((sum, point) => sum + (Number(point.value) || 0), 0),
        1
      );
      let cumulative = 0;
      const gradientSegments = data
        .map((point, idx) => {
          const start = (cumulative / total) * 360;
          cumulative += Number(point.value) || 0;
          const end = (cumulative / total) * 360;
          const color = PIE_COLORS[idx % PIE_COLORS.length];
          return `${color} ${start}deg ${end}deg`;
        })
        .join(', ');

      return (
        <div className="chart-visual chart-visual-pie">
          <div
            className="chart-pie"
            style={{ background: `conic-gradient(${gradientSegments})` }}
          />
          <div className="chart-legend">
            {data.map((point, idx) => (
              <div key={point.id} className="chart-legend-item">
                <span
                  className="chart-legend-swatch"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="chart-legend-label">
                  {point.label || `Item ${idx + 1}`} - {point.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (chart.chartType === 'line' || chart.chartType === 'area') {
      const points = data
        .map((point, idx) => {
          const x = data.length === 1 ? 50 : (idx / (data.length - 1)) * 100;
          const value = Number(point.value) || 0;
          const y = 100 - (value / maxValue) * 100;
          return `${x},${y}`;
        })
        .join(' ');

      const circles = data.map((point, idx) => {
        const x = data.length === 1 ? 50 : (idx / (data.length - 1)) * 100;
        const value = Number(point.value) || 0;
        const y = 100 - (value / maxValue) * 100;
        return <circle key={point.id} cx={x} cy={y} r={2.8} fill={accentColor} />;
      });

      const polygonPoints =
        chart.chartType === 'area' ? `0,100 ${points} 100,100` : null;
      const gradientId = `chartAreaGradient-${chart.id ?? 'preview'}`;

      return (
        <div className="chart-visual chart-visual-line">
          <div className="chart-plot-area">
            <div className="chart-axis-title chart-axis-title-y">Value</div>
            <div className="chart-line-body">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={hexToRgba(accentColor, 0.45)} />
                    <stop offset="100%" stopColor={hexToRgba(accentColor, 0.05)} />
                  </linearGradient>
                </defs>
                {chart.chartType === 'area' && (
                  <polygon points={polygonPoints} fill={`url(#${gradientId})`} stroke="none" />
                )}
                <polyline
                  points={points}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {circles}
              </svg>
              <div className="chart-axis-labels">
                {data.map((point) => (
                  <span key={point.id}>{point.label}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-axis-title chart-axis-title-x">Categories</div>
        </div>
      );
    }

    return (
      <div className="chart-visual chart-visual-bar">
        <div className="chart-plot-area">
          <div className="chart-axis-title chart-axis-title-y">Value</div>
          <div className="chart-bar-group">
            {data.map((point, index) => {
              const value = Number(point.value) || 0;
              const height = Math.max((value / maxValue) * 100, 6);
              return (
                <div key={point.id} className="chart-bar">
                  <div
                    className="chart-bar-track"
                    title={`${point.label || `Item ${index + 1}`} - ${value}`}
                  >
                    <div
                      className="chart-bar-fill"
                      style={{ height: `${height}%`, backgroundColor: accentColor }}
                    />
                  </div>
                  <span className="chart-bar-label">
                    {point.label || `Item ${index + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="chart-axis-title chart-axis-title-x">Categories</div>
      </div>
    );
  };

  const renderTextToolbar = () => {
    if (!selectedElement || selectedElement.type !== 'text' || !toolbarPosition) {
      return null;
    }

    const styleKey = selectedElement.textStyle || 'paragraph';
    const fontFamily =
      selectedElement.fontFamily ||
      FONT_FAMILIES[0].value;

    return (
      <div
        className="text-floating-toolbar"
        style={{
          top: toolbarPosition.top,
          left: toolbarPosition.left
        }}
      >
        <select
          value={styleKey}
          onChange={(e) => handleTextStyleChange(e.target.value)}
        >
          {Object.entries(TEXT_STYLES).map(([key, style]) => (
            <option key={key} value={key}>
              {style.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={selectedElement.fontSize || TEXT_STYLES[styleKey].fontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          min={8}
          max={200}
        />

        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
        >
          {FONT_FAMILIES.map((family) => (
            <option key={family.value} value={family.value}>
              {family.label}
            </option>
          ))}
        </select>

        <label className="color-control" title="Text color">
          <span
            className="color-preview"
            style={{ backgroundColor: selectedElement.color || '#f5f5f5' }}
          />
          <input
            type="color"
            value={selectedElement.color || '#f5f5f5'}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </label>

        <div className="toolbar-divider" />

        <div className="toolbar-group" role="group" aria-label="Alignment">
          {ALIGN_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                selectedElement.textAlign === option.value ? 'active' : ''
              }
              onClick={() => handleAlignmentChange(option.value)}
            >
              {option.label[0]}
            </button>
          ))}
        </div>

        <div className="toolbar-group" role="group" aria-label="Formatting">
          <button
            type="button"
            className={selectedElement.bold ? 'active' : ''}
            onClick={() => handleToggleFormat('bold')}
          >
            B
          </button>
          <button
            type="button"
            className={selectedElement.italic ? 'active' : ''}
            onClick={() => handleToggleFormat('italic')}
          >
            I
          </button>
          <button
            type="button"
            className={selectedElement.underline ? 'active' : ''}
            onClick={() => handleToggleFormat('underline')}
          >
            U
          </button>
        </div>

        <div className="toolbar-divider" />

        <button
          type="button"
          className="delete-action"
          onClick={() => deleteElement(selectedElement.id)}
        >
          Delete
        </button>
      </div>
    );
  };

  const renderShapeToolbar = () => {
    if (
      !selectedElement ||
      selectedElement.type !== 'shape' ||
      !shapeToolbarPosition
    ) {
      return null;
    }

    return (
      <div
        className="shape-floating-toolbar"
        style={{
          top: shapeToolbarPosition.top,
          left: shapeToolbarPosition.left
        }}
      >
        <div className="toolbar-group" aria-label="Fill and border colors">
          <label className="color-control" title="Fill color">
            <span
              className="color-preview"
              style={{ backgroundColor: selectedElement.color }}
            />
            <input
              type="color"
              value={selectedElement.color}
              onChange={(e) =>
                updateElement(selectedElement.id, { color: e.target.value })
              }
            />
          </label>

          <label className="color-control" title="Border color">
            <span
              className="color-preview"
              style={{ backgroundColor: selectedElement.borderColor }}
            />
            <input
              type="color"
              value={selectedElement.borderColor}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  borderColor: e.target.value
                })
              }
            />
          </label>
        </div>

        <div className="shape-toolbar-input">
          <input
            type="number"
            min={0}
            max={24}
            value={selectedElement.borderWidth}
            onChange={(e) =>
              updateElement(selectedElement.id, {
                borderWidth: Math.max(0, parseInt(e.target.value, 10) || 0)
              })
            }
          />
          <span>px border</span>
        </div>

        <div className="toolbar-group" aria-label="Shape style">
          <button
            type="button"
            className={selectedElement.shape === 'rectangle' ? 'active' : ''}
            onClick={() =>
              updateElement(selectedElement.id, { shape: 'rectangle' })
            }
          >
            ▭
          </button>
          <button
            type="button"
            className={selectedElement.shape === 'circle' ? 'active' : ''}
            onClick={() =>
              updateElement(selectedElement.id, { shape: 'circle' })
            }
          >
            ◯
          </button>
        </div>

        <div className="toolbar-divider" />

        <button
          type="button"
          className="delete-action"
          onClick={() => deleteElement(selectedElement.id)}
        >
          Delete
        </button>
      </div>
    );
  };

  const renderChartToolbar = () => {
    if (
      !selectedElement ||
      selectedElement.type !== 'chart' ||
      !chartToolbarPosition
    ) {
      return null;
    }

    const accentColor = selectedElement.accentColor || '#1a73e8';

    return (
      <div
        className="chart-floating-toolbar"
        style={{
          top: chartToolbarPosition.top,
          left: chartToolbarPosition.left
        }}
      >
        <div className="toolbar-group" role="group" aria-label="Chart type">
          {CHART_TYPES.map((chart) => (
            <button
              key={chart.value}
              type="button"
              className={
                selectedElement.chartType === chart.value ? 'active' : ''
              }
              onClick={() =>
                updateElement(selectedElement.id, { chartType: chart.value })
              }
            >
              {chart.label}
            </button>
          ))}
        </div>

        <label className="color-control" title="Accent color">
          <span
            className="color-preview"
            style={{ backgroundColor: accentColor }}
          />
          <input
            type="color"
            value={accentColor}
            onChange={(e) =>
              updateElement(selectedElement.id, {
                accentColor: e.target.value,
                background: hexToRgba(e.target.value, 0.12)
              })
            }
          />
        </label>

        <div className="toolbar-divider" />

        <button
          type="button"
          className="delete-action"
          onClick={() => deleteElement(selectedElement.id)}
        >
          Delete
        </button>
      </div>
    );
  };

  return (
    <div className="slide-editor">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageInputChange}
      />
      <div className="slide-editor-header">
        <div className="slide-editor-header-spacer" aria-hidden="true" />
      </div>

      <div
        ref={canvasRef}
        className={`slide-canvas ${
          isAddingText || isAddingShape || isAddingChart ? 'adding-element' : ''
        }`}
        style={{
          backgroundColor: currentBackground
        }}
        onClick={handleCanvasClick}
      >
        {slide.content.map((element) => {
          if (element.type === 'text') {
            const computedFontWeight = element.bold
              ? 700
              : element.fontWeight || TEXT_STYLES[element.textStyle || 'paragraph'].fontWeight;

            return (
              <div
                key={element.id}
                ref={registerElementRef(element.id)}
                className={`text-element ${
                  selectedElementId === element.id ? 'selected' : ''
                }`}
                style={{
                  left: element.x,
                  top: element.y,
                  ...(element.width ? { width: element.width } : {}),
                  color: element.color || '#f5f5f5',
                  fontSize: element.fontSize || TEXT_STYLES.paragraph.fontSize,
                  fontFamily:
                    element.fontFamily ||
                    FONT_FAMILIES[0].value,
                  fontWeight: computedFontWeight,
                  fontStyle: element.italic ? 'italic' : 'normal',
                  textDecoration: element.underline ? 'underline' : 'none',
                  textAlign: element.textAlign || 'left',
                  lineHeight: 1.2
                }}
                onClick={(e) => handleElementClick(e, element)}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                contentEditable={selectedElementId === element.id}
                suppressContentEditableWarning
                onBlur={(e) => handleTextBlur(e, element)}
              >
                {element.text}
                {selectedElementId === element.id && (
                  <span
                    className="resize-handle"
                    role="presentation"
                    contentEditable={false}
                    onMouseDown={(e) => handleResizeMouseDown(e, element)}
                  />
                )}
              </div>
            );
          }

          if (element.type === 'shape') {
            return (
              <div
                key={element.id}
                ref={registerElementRef(element.id)}
                className={`shape-element ${
                  selectedElementId === element.id ? 'selected' : ''
                }`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  backgroundColor: element.color,
                  border: `${element.borderWidth}px solid ${element.borderColor}`,
                  borderRadius: element.shape === 'circle' ? '50%' : '0'
                }}
                onClick={(e) => handleElementClick(e, element)}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
              >
                {selectedElementId === element.id && (
                  <span
                    className="resize-handle"
                    role="presentation"
                    onMouseDown={(e) => handleResizeMouseDown(e, element)}
                  />
                )}
              </div>
            );
          }

          if (element.type === 'image') {
            return (
              <div
                key={element.id}
                ref={registerElementRef(element.id)}
                className={`image-element ${
                  selectedElementId === element.id ? 'selected' : ''
                }`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width || 240,
                  height: element.height || 160
                }}
                onClick={(e) => handleElementClick(e, element)}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
              >
                <img
                  src={element.src}
                  alt={element.alt || ''}
                  draggable={false}
                />
                {selectedElementId === element.id && (
                  <span
                    className="resize-handle"
                    role="presentation"
                    onMouseDown={(e) => handleResizeMouseDown(e, element)}
                  />
                )}
              </div>
            );
          }

          if (element.type === 'chart') {
            const accentColor = element.accentColor || '#1a73e8';

            return (
              <div
                key={element.id}
                ref={registerElementRef(element.id)}
                className={`chart-element ${
                  selectedElementId === element.id ? 'selected' : ''
                }`}
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                '--chart-accent': accentColor
              }}
              onClick={(e) => handleElementClick(e, element)}
              onMouseDown={(e) => handleElementMouseDown(e, element)}
            >
              <div className="chart-placeholder">
                {renderChartVisual(element)}
              </div>
              {selectedElementId === element.id && (
                <span
                  className="resize-handle"
                  role="presentation"
                  onMouseDown={(e) => handleResizeMouseDown(e, element)}
                />
              )}
            </div>
            );
          }

          return null;
        })}

        {(isAddingText || isAddingShape || isAddingChart) && (
          <div className="canvas-instruction">
            Click anywhere to add{' '}
            {isAddingText ? 'text' : isAddingShape ? 'shape' : 'chart'}
          </div>
        )}

        {renderTextToolbar()}
        {renderShapeToolbar()}
        {renderChartToolbar()}
      </div>

      {selectedElement && selectedElement.type === 'image' && (
        <div className="element-properties image-properties-panel">
          <h4>Image properties</h4>
          <button
            className="delete-btn"
            onClick={() => deleteElement(selectedElement.id)}
          >
            Delete
          </button>

          <div className="image-properties">
            <button
              type="button"
              className="replace-image-btn"
              onClick={() => openImagePicker(selectedElement.id)}
            >
              Replace image
            </button>

            <label>
              Alt text
              <input
                type="text"
                value={selectedElement.alt || ''}
                onChange={(e) =>
                  updateElement(selectedElement.id, { alt: e.target.value })
                }
              />
            </label>

            <div className="image-dimension-group">
              <label>
                Width (px)
                <input
                  type="number"
                  min={40}
                  value={Math.round(selectedElement.width || 0)}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    if (Number.isNaN(raw)) {
                      return;
                    }
                    const ratio =
                      selectedElement.aspectRatio && selectedElement.aspectRatio > 0
                        ? selectedElement.aspectRatio
                        : selectedElement.width && selectedElement.height
                        ? selectedElement.width / Math.max(selectedElement.height, 1)
                        : 1;
                    const widthValue = Math.max(40, raw);
                    const heightValue = Math.round(
                      widthValue / Math.max(ratio, 0.0001)
                    );
                    updateImageDimensions(
                      selectedElement.id,
                      widthValue,
                      heightValue
                    );
                  }}
                />
              </label>
              <label>
                Height (px)
                <input
                  type="number"
                  min={40}
                  value={Math.round(selectedElement.height || 0)}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    if (Number.isNaN(raw)) {
                      return;
                    }
                    const ratio =
                      selectedElement.aspectRatio && selectedElement.aspectRatio > 0
                        ? selectedElement.aspectRatio
                        : selectedElement.width && selectedElement.height
                        ? selectedElement.width / Math.max(selectedElement.height, 1)
                        : 1;
                    const heightValue = Math.max(40, raw);
                    const widthValue = Math.round(heightValue * Math.max(ratio, 0.0001));
                    updateImageDimensions(
                      selectedElement.id,
                      widthValue,
                      heightValue
                    );
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {selectedElement && selectedElement.type === 'shape' && (
        <div className="element-properties">
          <h4>Shape properties</h4>
          <button
            className="delete-btn"
            onClick={() => deleteElement(selectedElement.id)}
          >
            Delete
          </button>

          <div className="shape-properties">
            <label>
              Fill Color
              <input
                type="color"
                value={selectedElement.color}
                onChange={(e) =>
                  updateElement(selectedElement.id, { color: e.target.value })
                }
              />
            </label>
            <label>
              Border Color
              <input
                type="color"
                value={selectedElement.borderColor}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    borderColor: e.target.value
                  })
                }
              />
            </label>
            <label>
              Border Width
              <input
                type="number"
                min={0}
                value={selectedElement.borderWidth}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    borderWidth: parseInt(e.target.value, 10) || 0
                  })
                }
              />
            </label>
            <label>
              Shape
              <select
                value={selectedElement.shape}
                onChange={(e) =>
                  updateElement(selectedElement.id, { shape: e.target.value })
                }
              >
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {selectedElement && selectedElement.type === 'chart' && (
        <div className="element-properties chart-properties-panel">
          <div className="chart-properties-header">
            <h4>Chart</h4>
            <button
              type="button"
              className="delete-btn"
              onClick={() => deleteElement(selectedElement.id)}
            >
              Delete
            </button>
          </div>

          <div className="chart-properties-body">
            <div className="chart-preview-pane" aria-label="Chart preview">
              {renderChartVisual(selectedElement)}
            </div>

            <div className="chart-data-editor">
              <h5>Data</h5>
              <div className="chart-data-list">
                {(selectedElement.data || []).map((point) => (
                  <div key={point.id} className="chart-data-row">
                    <div className="chart-data-field">
                      <label htmlFor={`chart-label-${point.id}`}>Label</label>
                      <input
                        id={`chart-label-${point.id}`}
                        type="text"
                        value={point.label}
                        onChange={(e) =>
                          handleUpdateChartPoint(point.id, {
                            label: e.target.value
                          })
                        }
                      />
                    </div>
                    <div className="chart-data-field">
                      <label htmlFor={`chart-value-${point.id}`}>Value</label>
                      <input
                        id={`chart-value-${point.id}`}
                        type="number"
                        min="0"
                        value={point.value}
                        onChange={(e) =>
                          handleUpdateChartPoint(point.id, {
                            value: Number(e.target.value)
                          })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="remove-data-btn"
                      onClick={() => handleRemoveChartPoint(point.id)}
                      title="Remove data row"
                      disabled={(selectedElement.data || []).length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="add-data-btn"
                onClick={handleAddChartPoint}
              >
                Add data row
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SlideEditor;
