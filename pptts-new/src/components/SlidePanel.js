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
    addSlide(selectedLayout);
    setIsLayoutPickerOpen(false);
  };

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('layout-picker-overlay')) {
      setIsLayoutPickerOpen(false);
    }
  };

  const handleClosePicker = () => setIsLayoutPickerOpen(false);

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
            className={`slide-thumbnail ${currentSlide === index ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          >
            <div className="slide-thumbnail-actions">
              <button
                type="button"
                className="move-slide-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSlide?.(index, -1);
                }}
                disabled={index === 0}
                aria-label="Move slide up"
              >
                Up
              </button>
              <button
                type="button"
                className="move-slide-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSlide?.(index, 1);
                }}
                disabled={index === slides.length - 1}
                aria-label="Move slide down"
              >
                Down
              </button>
              <button
                type="button"
                className="delete-slide-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSlide(index);
                }}
                title="Delete Slide"
              >
                X
              </button>
            </div>
            <div className="slide-index-pill">{index + 1}</div>
            <div className="slide-preview" style={{ backgroundColor: slide.background }}>
              {slide.content.length === 0 && (
                <div className="slide-placeholder">Click to add content</div>
              )}
              {slide.content.map((item, itemIndex) => (
                <div key={itemIndex} className="slide-content-preview">
                  {item.type === 'text' && (
                    <div className="text-preview">
                      {item.text.length > 32 ? `${item.text.substring(0, 32)}...` : item.text}
                    </div>
                  )}
                  {item.type === 'shape' && (
                    <div className="shape-preview" style={{ backgroundColor: item.color }} />
                  )}
                  {item.type === 'image' && (
                    <div
                      className="image-preview"
                      style={{ backgroundImage: `url(${item.src})` }}
                    />
                  )}
                  {item.type === 'chart' && (
                    <div className="chart-preview">{item.chartType.toUpperCase()}</div>
                  )}
                </div>
              ))}
            </div>
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
