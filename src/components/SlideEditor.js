import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import './SlideEditor.css';
import './ChartStyles.css';
import ChartComponent from './ChartComponent';

// Register Chart.js components
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const TEXT_STYLES = {
  heading: { label: 'Heading', fontSize: 56, fontWeight: 600 },
  title: { label: 'Title', fontSize: 40, fontWeight: 500 },
  paragraph: { label: 'Paragraph', fontSize: 20, fontWeight: 400 }
};

const CHART_SERIES_COLORS = [
  '#2563eb',
  '#f97316',
  '#34d399',
  '#fbbf24',
  '#c084fc',
  '#f472b6'
];

const MAX_IMAGE_CANVAS_RATIO = 0.72;
const DEFAULT_BACKGROUND = '#050505'; // Changed from '#050505' to white
const MIN_TEXT_WIDTH = 120;
const MIN_ELEMENT_SIZE = 60;
const MIN_CHART_HEIGHT = 120;

const createSeriesId = () =>
  `chart-series-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createCategoryId = () =>
  `chart-category-${Date.now()}-${Math.random().toString(16).slice(2)}`;

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

const createChartSeries = (name, color) => ({
  id: createSeriesId(),
  name,
  color
});

const createChartPoint = (label, seriesList, defaultValues = []) => {
  const values = (seriesList || []).reduce((accumulator, series, index) => {
    const preset = defaultValues?.[index];
    const numericPreset = Number(preset);
    accumulator[series.id] = Number.isFinite(numericPreset) ? numericPreset : 0;
    return accumulator;
  }, {});

  return {
    id: createCategoryId(),
    label,
    values
  };
};

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

  const getNormalizedChartStructure = useCallback(
    (chart) => {
      if (!chart || chart.type !== 'chart') {
        return { series: [], data: [] };
      }

      const paletteColor = (index) =>
        CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];

      const inputSeries = Array.isArray(chart.series) ? chart.series : [];
      let normalizedSeries =
        inputSeries.length > 0
          ? inputSeries.map((series, index) => {
              const fallbackColor =
                index === 0 && chart.accentColor
                  ? chart.accentColor
                  : paletteColor(index);
              const name =
                typeof series?.name === 'string' && series.name.trim()
                  ? series.name
                  : `Series ${index + 1}`;
              const color =
                typeof series?.color === 'string' && series.color.trim()
                  ? series.color
                  : fallbackColor;
              const id = series?.id || createSeriesId();
              return { id, name, color };
            })
          : [
              createChartSeries(
                'Series 1',
                chart.accentColor || paletteColor(0)
              )
            ];

      const seenSeriesIds = new Set();
      normalizedSeries = normalizedSeries.map((series, index) => {
        let seriesId = series.id;
        if (!seriesId || seenSeriesIds.has(seriesId)) {
          seriesId = createSeriesId();
        }
        seenSeriesIds.add(seriesId);
        const fallbackColor =
          index === 0 && chart.accentColor
            ? chart.accentColor
            : paletteColor(index);
        return {
          id: seriesId,
          name: series.name,
          color: series.color || fallbackColor
        };
      });

      const ensureValuesForSeries = (values) => {
        const sanitized = {};
        normalizedSeries.forEach((series) => {
          const raw = values?.[series.id];
          const numeric = Number(raw);
          sanitized[series.id] = Number.isFinite(numeric) ? numeric : 0;
        });
        return sanitized;
      };

      const rawData = Array.isArray(chart.data) ? chart.data : [];
      const seenCategoryIds = new Set();
      let normalizedData = rawData.map((point, index) => {
        const label =
          typeof point?.label === 'string' && point.label.trim()
            ? point.label
            : `Item ${index + 1}`;
        const values =
          point && typeof point === 'object' && point.values
            ? ensureValuesForSeries(point.values)
            : ensureValuesForSeries({});

        if (
          (!point?.values || typeof point.values !== 'object') &&
          Number.isFinite(Number(point?.value))
        ) {
          const firstSeries = normalizedSeries[0];
          if (firstSeries) {
            values[firstSeries.id] = Number(point.value);
          }
        }

        let categoryId = point?.id;
        if (!categoryId || seenCategoryIds.has(categoryId)) {
          categoryId = createCategoryId();
        }
        seenCategoryIds.add(categoryId);

        return {
          id: categoryId,
          label,
          values
        };
      });

      if (!normalizedData.length) {
        normalizedData = [createChartPoint('Category 1', normalizedSeries)];
      }

      return {
        series: normalizedSeries,
        data: normalizedData
      };
    },
    []
  );

  const normalizedSelectedChart = useMemo(() => {
    if (!selectedElement || selectedElement.type !== 'chart') {
      return null;
    }
    return getNormalizedChartStructure(selectedElement);
  }, [getNormalizedChartStructure, selectedElement]);

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
      const primaryColor = CHART_SERIES_COLORS[0];
      const secondaryColor = CHART_SERIES_COLORS[1];
      const defaultSeries = [
        createChartSeries('Science', primaryColor),
        createChartSeries('Math', secondaryColor)
      ];
      const defaultDataSeeds = [
        [82, 78],
        [88, 84],
        [64, 58],
        [68, 62],
        [94, 88]
      ];
      const defaultLabels = ['Sachin', 'Sujay', 'Shivam', 'Manoj', 'Amraditya'];
      const defaultData = defaultLabels.map((label, index) =>
        createChartPoint(label, defaultSeries, defaultDataSeeds[index])
      );

      const newChart = {
        id: Date.now(),
        type: 'chart',
        chartType: 'bar',
        x: Math.max(32, x - 120),
        y: Math.max(32, y - 80),
        width: 260,
        height: 180,
        title: 'Chart Title',
        accentColor: primaryColor,
        background: hexToRgba(primaryColor, 0.12),
        series: defaultSeries,
        data: defaultData
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


  const handleChartTitleChange = useCallback(
    (title) => {
      if (!selectedElement || selectedElement.type !== 'chart') {
        return;
      }
      updateElement(selectedElement.id, { title });
    },
    [selectedElement, updateElement]
  );

  const handleTextBlur = (event, element) => {
    const text = event.target.textContent || '';
    updateElement(element.id, { text });
  };

  const renderChartVisual = (chart) => {
    try {
      const { series, data } = getNormalizedChartStructure(chart);
      
      if (!data.length || !series.length) {
        return (
          <div className="chart-empty">
            <p>No data available</p>
            <p>Add data points to see the chart</p>
          </div>
        );
      }

      // Prepare data for Chart.js
      const labels = data.map(point => point.label || 'Category');
      const datasets = series.map((seriesItem, index) => {
        const color = seriesItem.color || CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];
        return {
          label: seriesItem.name,
          data: data.map(point => {
            const value = point.values[seriesItem.id];
            return typeof value === 'number' ? value : 0;
          }),
          backgroundColor: chart.chartType === 'pie' || chart.chartType === 'doughnut' 
            ? data.map((_, i) => {
                const colorIndex = i % CHART_SERIES_COLORS.length;
                return CHART_SERIES_COLORS[colorIndex];
              })
            : hexToRgba(color, 0.7),
          borderColor: color,
          borderWidth: 1,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color,
          pointHoverRadius: 5,
          pointHoverBorderWidth: 2,
          tension: chart.chartType === 'line' ? 0.3 : 0.1,
          fill: chart.chartType === 'area',
          borderJoinStyle: 'round',
          pointHitRadius: 10
        };
      });

      const chartData = {
        labels,
        datasets
      };

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          easing: 'easeOutQuart'
        },
        layout: {
          padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
          }
        },
        plugins: {
          title: {
            display: !!chart.title?.trim(),
            text: chart.title?.trim() || '',
            font: {
              size: 16,
              weight: '600',
              family: 'Arial, sans-serif'
            },
            padding: {
              bottom: 15,
              top: 5
            },
            color: '#333'
          },
          legend: {
            position: 'top',
            align: 'center',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 12,
                family: 'Arial, sans-serif'
              },
              color: '#555'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            titleFont: {
              size: 13,
              weight: '600',
              family: 'Arial, sans-serif'
            },
            bodyFont: {
              size: 12,
              family: 'Arial, sans-serif'
            },
            padding: 10,
            cornerRadius: 6,
            displayColors: true,
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y;
                }
                return label;
              }
            }
          }
        },
        scales: chart.chartType === 'pie' || chart.chartType === 'doughnut' ? {} : {
          x: {
            title: {
              display: true,
              text: chart.xAxisLabel || 'Categories',
              font: {
                weight: '500',
                size: 12,
                family: 'Arial, sans-serif'
              },
              color: '#666',
              padding: { top: 10, bottom: 5 }
            },
            grid: {
              display: false,
              drawBorder: false,
              drawOnChartArea: false,
            },
            ticks: {
              font: {
                size: 11,
                family: 'Arial, sans-serif'
              },
              color: '#666',
              padding: 8
            }
          },
          y: {
            title: {
              display: true,
              text: chart.yAxisLabel || 'Value',
              font: {
                weight: '500',
                size: 12,
                family: 'Arial, sans-serif'
              },
              color: '#666',
              padding: { bottom: 10, top: 5 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false,
              borderDash: [5, 5],
              drawTicks: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'Arial, sans-serif'
              },
              color: '#666',
              padding: 8,
              maxTicksLimit: 6
            },
            beginAtZero: true
          }
        },
        elements: {
          bar: {
            borderRadius: 4,
            borderSkipped: false
          },
          point: {
            radius: 3,
            hoverRadius: 5,
            hoverBorderWidth: 2
          },
          line: {
            tension: 0.3,
            borderWidth: 2,
            fill: false
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      };

      const chartType = chart.chartType === 'area' ? 'line' : chart.chartType;

      return (
        <div style={{
          width: '100%',
          height: '100%',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <ChartComponent 
              type={chartType}
              data={chartData}
              options={chartOptions}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            />
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className="chart-error">
          <p>Error rendering chart</p>
          <p style={{ fontSize: '0.8em', color: '#999' }}>{error.message}</p>
        </div>
      );
    }
  };

  const renderElement = (element) => {
    if (element.type === 'text') {
      return (
        <div
          ref={registerElementRef(element.id)}
          className={`editable-text ${element.id === selectedElementId ? 'selected' : ''}`}
          style={{
            fontFamily: element.fontFamily || 'Arial, sans-serif',
            fontSize: element.fontSize || 16,
            fontWeight: element.fontWeight || 400,
            color: element.color || '#000000',
            textAlign: element.textAlign || 'left',
            lineHeight: 1.4,
            padding: '8px 12px',
            borderRadius: '4px',
            outline: 'none',
            wordBreak: 'break-word',
            backgroundColor: element.backgroundColor || 'transparent',
            ...(element.italic && { fontStyle: 'italic' }),
            ...(element.underline && { textDecoration: 'underline' }),
            ...(element.strikethrough && { textDecoration: 'line-through' })
          }}
          contentEditable={element.id === selectedElementId}
          suppressContentEditableWarning
          onBlur={(e) => handleTextBlur(e, element)}
          dangerouslySetInnerHTML={{ __html: element.text || '' }}
        />
      );
    } else if (element.type === 'shape') {
      return (
        <div
          ref={registerElementRef(element.id)}
          className={`shape ${element.id === selectedElementId ? 'selected' : ''}`}
          style={{
            backgroundColor: element.backgroundColor || '#000000',
            borderRadius: element.shape === 'rectangle' ? '4px' : '50%',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: element.color || '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            overflow: 'hidden'
          }}
        >
          {element.text || ''}
        </div>
      );
    } else if (element.type === 'chart') {
      return (
        <div
          ref={registerElementRef(element.id)}
          className={`chart-container ${element.id === selectedElementId ? 'selected' : ''}`}
          style={{
            backgroundColor: element.background || '#ffffff',
            borderRadius: '8px',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            padding: '12px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {renderChartVisual(element)}
        </div>
      );
    } else if (element.type === 'image' && element.src) {
      return (
        <div
          ref={registerElementRef(element.id)}
          className={`image-container ${element.id === selectedElementId ? 'selected' : ''}`}
          style={{
            width: '100%',
            height: '100%',
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
  };

  const renderTextToolbar = () => {
    if (!selectedElement || selectedElement.type !== 'text' || !toolbarPosition) {
      return null;
    }

    return (
      <div 
        className="text-floating-toolbar"
        style={{
          position: 'absolute',
          left: toolbarPosition.left,
          top: toolbarPosition.top,
          transform: 'translateX(-50%)'
        }}
      >
        {/* Text toolbar content */}
        <div className="toolbar-group">
          {Object.entries(TEXT_STYLES).map(([key, style]) => (
            <button
              key={key}
              className={selectedElement.textStyle === key ? 'active' : ''}
              onClick={() => handleTextStyleChange(key)}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderShapeToolbar = () => {
    if (!selectedElement || selectedElement.type !== 'shape' || !shapeToolbarPosition) {
      return null;
    }

    return (
      <div 
        className="shape-floating-toolbar"
        style={{
          position: 'absolute',
          left: shapeToolbarPosition.left,
          top: shapeToolbarPosition.top,
          transform: 'translateX(-50%)'
        }}
      >
        {/* Shape toolbar content */}
        <div className="toolbar-group">
          <button onClick={() => deleteElement(selectedElement.id)}>
            Delete
          </button>
        </div>
      </div>
    );
  };

  const renderChartToolbar = () => {
    if (!selectedElement || selectedElement.type !== 'chart' || !chartToolbarPosition) {
      return null;
    }

    return (
      <div 
        className="chart-floating-toolbar"
        style={{
          position: 'absolute',
          left: chartToolbarPosition.left,
          top: chartToolbarPosition.top,
          transform: 'translateX(-50%)'
        }}
      >
        {/* Chart toolbar content */}
        <div className="toolbar-group">
          <button onClick={() => handleChartTitleChange('')}>
            Clear Title
          </button>
          <button onClick={() => deleteElement(selectedElement.id)}>
            Delete
          </button>
        </div>
      </div>
    );
  };

  const renderSlideContent = () => {
    if (slide?.content?.length === 0) {
      return (
        <div className="empty-slide">
          <p>Click "+" to add content to your slide</p>
        </div>
      );
    }

    return (
      <div className="slide-content">
        {slide?.content?.map((element) => (
          <div
            key={element.id}
            className={`slide-element ${element.id === selectedElementId ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: `${element.x}px`,
              top: `${element.y}px`,
              width: `${element.width}px`,
              height: `${element.height}px`,
              zIndex: element.zIndex || 1,
              cursor: 'move',
              userSelect: 'none',
              outline: element.id === selectedElementId ? '2px solid #1a73e8' : 'none',
              outlineOffset: element.id === selectedElementId ? '2px' : '0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElementId(element.id);
            }}
          >
            {renderElement(element)}
          </div>
        ))}

        {(isAddingText || isAddingShape || isAddingChart) && (
          <div className="canvas-instruction">
            Click anywhere to add{' '}
            {isAddingText ? 'text' : isAddingShape ? 'shape' : 'chart'}
          </div>
        )}

        {renderTextToolbar()}
        {renderShapeToolbar()}
        {renderChartToolbar()}

        {selectedElement && selectedElement.type === 'image' && (
          <div className="element-properties image-properties-panel">
            {/* Image properties panel content */}
          </div>
        )}

        {selectedElement && selectedElement.type === 'shape' && (
          <div className="element-properties">
            {/* Shape properties panel content */}
          </div>
        )}

        {selectedElement && selectedElement.type === 'chart' && normalizedSelectedChart && (
          <div className="element-properties chart-properties-panel">
            {/* Chart properties panel content */}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="slide-editor">
      <div className="canvas-container">
        <div
          className="canvas"
          ref={canvasRef}
          style={{
            backgroundColor: currentBackground,
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
          onClick={handleCanvasClick}
        >
          {renderSlideContent()}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImageInputChange}
      />

      {/* Toolbar and other components can be added here */}
    </div>
  );
};

export default SlideEditor;
