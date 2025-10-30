import React, { useState, useEffect, useCallback } from 'react';
import './TableToolbar.css';

const TableToolbar = ({
  element,
  onUpdate,
  onDelete,
  position = { x: 0, y: 0 },
  isVisible = false,
  onDismiss
}) => {
  const tableData = element?.tableData || {};
  const [rows, setRows] = useState(tableData.rows || 3);
  const [cols, setCols] = useState(tableData.cols || 3);
  const [headerRow, setHeaderRow] = useState(tableData.headerRow ?? true);
  const [borderStyle, setBorderStyle] = useState(tableData.borderStyle || 'all');

  useEffect(() => {
    if (element?.tableData) {
      setRows(element.tableData.rows || 3);
      setCols(element.tableData.cols || 3);
      setHeaderRow(element.tableData.headerRow ?? true);
      setBorderStyle(element.tableData.borderStyle || 'all');
    }
  }, [element]);

  const updateTableData = useCallback((updates) => {
    if (!element) return;
    
    const currentData = element.tableData || {};
    const updatedData = { ...currentData, ...updates };
    
    // If rows or cols changed, adjust cells array
    if (updates.rows || updates.cols) {
      const newRows = updates.rows || currentData.rows;
      const newCols = updates.cols || currentData.cols;
      const oldCells = currentData.cells || [];
      
      const newCells = Array(newRows).fill(null).map((_, rowIdx) =>
        Array(newCols).fill(null).map((_, colIdx) => 
          oldCells[rowIdx]?.[colIdx] || ''
        )
      );
      
      updatedData.cells = newCells;
      updatedData.rows = newRows;
      updatedData.cols = newCols;
    }
    
    onUpdate(element.id, { tableData: updatedData });
  }, [element, onUpdate]);

  const handleRowsChange = (value) => {
    const newRows = Math.max(1, Math.min(20, parseInt(value) || 1));
    setRows(newRows);
    updateTableData({ rows: newRows });
  };

  const handleColsChange = (value) => {
    const newCols = Math.max(1, Math.min(10, parseInt(value) || 1));
    setCols(newCols);
    updateTableData({ cols: newCols });
  };

  const handleHeaderRowToggle = () => {
    const newValue = !headerRow;
    setHeaderRow(newValue);
    updateTableData({ headerRow: newValue });
  };

  const handleBorderStyleChange = (style) => {
    setBorderStyle(style);
    updateTableData({ borderStyle: style });
  };

  const addRow = () => {
    const newRows = Math.min(20, rows + 1);
    setRows(newRows);
    updateTableData({ rows: newRows });
  };

  const removeRow = () => {
    if (rows > 1) {
      const newRows = rows - 1;
      setRows(newRows);
      updateTableData({ rows: newRows });
    }
  };

  const addColumn = () => {
    const newCols = Math.min(10, cols + 1);
    setCols(newCols);
    updateTableData({ cols: newCols });
  };

  const removeColumn = () => {
    if (cols > 1) {
      const newCols = cols - 1;
      setCols(newCols);
      updateTableData({ cols: newCols });
    }
  };

  if (!isVisible || !element) {
    return null;
  }

  const toolbarStyle = {
    left: `${position.x}px`,
    top: `${Math.max(position.y - 56, 8)}px`,
    transform: 'translateX(-50%)'
  };

  return (
    <div 
      className="table-toolbar-wrapper"
      style={toolbarStyle}
      onMouseLeave={onDismiss}
    >
      <div className="table-toolbar">
        <div className="table-toolbar-section">
          <label className="table-toolbar-label">Rows:</label>
          <div className="table-toolbar-stepper">
            <button 
              className="stepper-btn"
              onClick={removeRow}
              disabled={rows <= 1}
            >
              −
            </button>
            <input
              type="number"
              className="table-input-small"
              value={rows}
              onChange={(e) => handleRowsChange(e.target.value)}
              min="1"
              max="20"
            />
            <button 
              className="stepper-btn"
              onClick={addRow}
              disabled={rows >= 20}
            >
              +
            </button>
          </div>
        </div>

        <div className="table-toolbar-section">
          <label className="table-toolbar-label">Cols:</label>
          <div className="table-toolbar-stepper">
            <button 
              className="stepper-btn"
              onClick={removeColumn}
              disabled={cols <= 1}
            >
              −
            </button>
            <input
              type="number"
              className="table-input-small"
              value={cols}
              onChange={(e) => handleColsChange(e.target.value)}
              min="1"
              max="10"
            />
            <button 
              className="stepper-btn"
              onClick={addColumn}
              disabled={cols >= 10}
            >
              +
            </button>
          </div>
        </div>

        <div className="table-toolbar-divider" />

        <div className="table-toolbar-section">
          <button
            className={`table-toolbar-btn ${headerRow ? 'active' : ''}`}
            onClick={handleHeaderRowToggle}
            title="Toggle header row"
          >
            Header
          </button>
        </div>

        <div className="table-toolbar-divider" />

        <div className="table-toolbar-section">
          <label className="table-toolbar-label">Borders:</label>
          <select
            className="table-select"
            value={borderStyle}
            onChange={(e) => handleBorderStyleChange(e.target.value)}
          >
            <option value="all">All</option>
            <option value="outer">Outer</option>
            <option value="none">None</option>
          </select>
        </div>

        <div className="table-toolbar-divider" />

        <button
          className="table-toolbar-delete"
          onClick={() => onDelete(element.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default React.memo(TableToolbar);
