import React, { useEffect, useMemo, useState } from 'react';
import './ChartToolbar.css';

const CHART_TYPE_OPTIONS = [
  { value: 'bar', label: 'Bar' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'line', label: 'Line' },
  { value: 'columnLine', label: 'Column + Line' }
];

const ChartToolbar = ({
  element,
  position = { x: 0, y: 0 },
  isVisible = false,
  onChangeType,
  onEditData,
  onDelete,
  onDismiss
}) => {
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    if (!element) {
      return;
    }
    setChartType(element.chartType || 'bar');
  }, [element]);

  const toolbarPosition = useMemo(() => {
    const offsetTop = Math.max((position?.y ?? 0) - 48, 8);
    return {
      left: position?.x ?? 0,
      top: offsetTop
    };
  }, [position?.x, position?.y]);

  if (!isVisible || !element) {
    return null;
  }

  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setChartType(newType);
    if (onChangeType && element) {
      onChangeType(element.id, newType);
    }
  };

  const handleMouseLeave = (event) => {
    const next = event.relatedTarget;
    if (next && next.closest('.chart-toolbar-wrapper')) {
      return;
    }
    onDismiss?.();
  };

  return (
    <div
      className="chart-toolbar-wrapper"
      style={{
        left: toolbarPosition.left,
        top: toolbarPosition.top,
        transform: 'translateX(-50%)'
      }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="chart-toolbar-inline">
        <select
          className="chart-type-select"
          value={chartType}
          onChange={handleTypeChange}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {CHART_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="chart-toolbar-button"
          onClick={(event) => {
            event.stopPropagation();
            onEditData?.(element.id);
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          Edit Data
        </button>

        <button
          type="button"
          className="chart-toolbar-button delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(element.id);
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ChartToolbar;
