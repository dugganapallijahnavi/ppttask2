import React, { useState } from 'react';
import './TableGridSelector.css';

const TableGridSelector = ({ onSelect, onClose }) => {
  const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 });
  const maxRows = 10;
  const maxCols = 10;

  const handleCellHover = (row, col) => {
    setHoveredCell({ row, col });
  };

  const handleCellClick = (row, col) => {
    onSelect(row + 1, col + 1);
    onClose();
  };

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < maxCols; col++) {
        const isHighlighted = row <= hoveredCell.row && col <= hoveredCell.col;
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`grid-cell ${isHighlighted ? 'highlighted' : ''}`}
            onMouseEnter={() => handleCellHover(row, col)}
            onClick={() => handleCellClick(row, col)}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="table-grid-selector">
      <div className="grid-header">
        <span className="grid-title">Insert Table</span>
        <button className="grid-close" onClick={onClose}>×</button>
      </div>
      <div 
        className="grid-container"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
          gridTemplateRows: `repeat(${maxRows}, 1fr)`
        }}
      >
        {renderGrid()}
      </div>
      <div className="grid-footer">
        {hoveredCell.row + 1} × {hoveredCell.col + 1} Table
      </div>
    </div>
  );
};

export default TableGridSelector;
