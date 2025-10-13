import React, { useEffect, useState } from 'react';
import './SlidePanel.css';
import { SLIDE_LAYOUTS, DEFAULT_LAYOUT_ID } from '../data/slideLayouts';

const SlidePanel = ({
  slides,
  currentSlide,
  setCurrentSlide,
  addSlide,
  deleteSlide,
  moveSlide
}) => {
  const [isLayoutPickerOpen, setIsLayoutPickerOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);

  useEffect(() => {
    if (!isLayoutPickerOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsLayoutPickerOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLayoutPickerOpen]);

  const handleAddClick = () => {
    setIsLayoutPickerOpen(true);
  };

  const handleLayoutSelect = (layoutId) => {
    const selectedLayout = layoutId || DEFAULT_LAYOUT_ID;
    if (addSlide) {
      addSlide(selectedLayout);
    }
    setIsLayoutPickerOpen(false);
  };

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('layout-picker-overlay')) {
      setIsLayoutPickerOpen(false);
    }
  };

  const handleClosePicker = () => setIsLayoutPickerOpen(false);

  const resetDragState = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    setDragPosition(null);
  };

  const handleThumbnailClick = (index) => {
    if (dragIndex !== null) {
      return;
    }
    setCurrentSlide(index);
  };

  const handleDragStart = (index) => (event) => {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index) => (event) => {
    event.preventDefault();
    if (index === dragIndex) {
      setDragOverIndex(null);
      setDragPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const position = offsetY > rect.height / 2 ? 'after' : 'before';
    setDragOverIndex(index);
    setDragPosition(position);
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (index) => () => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
      setDragPosition(null);
    }
  };

  const handleDrop = (index) => (event) => {
    event.preventDefault();
    const sourceData = event.dataTransfer.getData('text/plain');
    const sourceIndex = dragIndex ?? (sourceData ? parseInt(sourceData, 10) : NaN);
    if (Number.isNaN(sourceIndex) || sourceIndex < 0 || sourceIndex >= slides.length) {
      resetDragState();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const dropAfter = event.clientY - rect.top > rect.height / 2;
    let targetIndex = dropAfter ? index + 1 : index;

    if (targetIndex > slides.length) {
      targetIndex = slides.length;
    }

    let finalIndex = Math.min(targetIndex, slides.length - 1);
    if (sourceIndex < targetIndex) {
      finalIndex = Math.max(0, targetIndex - 1);
    }

    if (finalIndex !== sourceIndex && typeof moveSlide === 'function') {
      moveSlide(sourceIndex, finalIndex);
    }

    resetDragState();
  };

  const handleDragEnd = () => {
    resetDragState();
  };


  const handleSlideContextMenu = (e, index) => {
    e.preventDefault();
    // Context menu could be implemented here
  };

  const handleDeleteSlide = (event, index) => {
    event.stopPropagation();
    if (typeof deleteSlide === 'function') {
      deleteSlide(index);
    }
  };

  const getSlideTitle = (slide) => {
    const firstTextElement = slide?.content?.find((item) => item.type === 'text');
    if (firstTextElement?.text) {
      const firstLine = firstTextElement.text.split('\n').find((line) => line.trim().length);
      if (firstLine) {
        return firstLine.trim().slice(0, 80);
      }
      return firstTextElement.text.trim().slice(0, 80);
    }
    return 'Untitled Slide';
  };

  const getPreviewLines = (slide) => {
    const firstTextElement = slide?.content?.find((item) => item.type === 'text');
    if (firstTextElement?.text) {
      const lines = firstTextElement.text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length) {
        return lines.slice(0, 2);
      }
    }
    return ['Use the layout picker', 'to get started quickly'];
  };

  return (
    <div className="slide-panel">
      <div className="slide-panel-header">
        <h3>Slides</h3>
        <button
          type="button"
          className="add-slide-btn"
          onClick={handleAddClick}
          title="Add New Slide"
        >
          +
        </button>
      </div>

      <div className="slides-list">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide-thumbnail ${currentSlide === index ? 'active' : ''}${
              dragIndex === index ? ' dragging' : ''
            }${
              dragOverIndex === index && dragPosition ? ` drop-${dragPosition}` : ''
            }`}
            onClick={() => handleThumbnailClick(index)}
            onContextMenu={(e) => handleSlideContextMenu(e, index)}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDragLeave={handleDragLeave(index)}
            onDrop={handleDrop(index)}
            onDragEnd={handleDragEnd}
          >
            <div className="slide-thumb-number">{index + 1}</div>
            <div className="slide-thumb-preview">
              <div className="slide-thumb-preview-inner">
                {getPreviewLines(slide).map((line, lineIndex) => (
                  <span key={`${slide.id}-preview-line-${lineIndex}`}>{line}</span>
                ))}
              </div>
            </div>
            <div className="slide-title">{getSlideTitle(slide)}</div>
            {slides.length > 1 && (
              <button
                type="button"
                className="slide-thumb-delete"
                onClick={(event) => handleDeleteSlide(event, index)}
                aria-label={`Delete slide ${index + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {isLayoutPickerOpen && (
        <div
          className="layout-picker-overlay"
          onClick={handleOverlayClick}
          role="presentation"
        >
          <div className="layout-picker" role="dialog" aria-modal="true">
            <div className="layout-picker-header">
              <h4>Select a layout</h4>
              <button
                type="button"
                className="close-layout-picker"
                onClick={handleClosePicker}
                aria-label="Close layout picker"
              >
                X
              </button>
            </div>
            <div className="layout-picker-grid">
              {SLIDE_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  className="layout-card"
                  onClick={() => handleLayoutSelect(layout.id)}
                >
                  <div className="layout-card-preview">
                    <div className="layout-card-preview-canvas">
                      {layout.previewBlocks.map((block, blockIndex) => (
                        <span
                          key={`${layout.id}-block-${blockIndex}`}
                          className={`layout-preview-block variant-${block.variant}`}
                          style={{
                            width: block.width,
                            height: block.height,
                            top: block.top,
                            left: block.left
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="layout-card-body">
                    <div className="layout-card-title">{layout.name}</div>
                    <div className="layout-card-description">{layout.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidePanel;
