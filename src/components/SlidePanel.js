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
        {slides.map((slide, index) => {
          return (
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
              <div className="slide-card-header">
                <span className="slide-card-title">{`Slide ${index + 1}`}</span>
                {slides.length > 1 && (
                  <button
                    type="button"
                    className="slide-card-delete"
                    onClick={(event) => handleDeleteSlide(event, index)}
                    aria-label={`Delete slide ${index + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>

              <div 
                className="slide-card-preview"
                style={{ 
                  background: slide.background || '#ffffff',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {slide.content && slide.content.length > 0 ? (
                  slide.content.map((element) => {
                    const scale = 0.15; // Scale down for thumbnail
                    const previewStyle = {
                      position: 'absolute',
                      left: `${element.x * scale}px`,
                      top: `${element.y * scale}px`,
                      width: element.width ? `${element.width * scale}px` : 'auto',
                      height: element.height ? `${element.height * scale}px` : 'auto',
                      fontSize: element.fontSize ? `${element.fontSize * scale}px` : '3px',
                      color: element.color || '#000',
                      fontFamily: element.fontFamily || 'inherit',
                      fontWeight: element.bold ? 700 : (element.fontWeight || 400),
                      fontStyle: element.italic ? 'italic' : 'normal',
                      textAlign: element.textAlign || 'left',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      pointerEvents: 'none'
                    };

                    if (element.type === 'text') {
                      return (
                        <div key={element.id} style={previewStyle}>
                          {element.plainText || 'Text'}
                        </div>
                      );
                    }

                    if (element.type === 'shape') {
                      let clipPath = 'none';
                      let borderRadius = '2px';
                      
                      // Set clip-path based on shape type
                      if (element.shape === 'circle') {
                        borderRadius = '50%';
                      } else if (element.shape === 'triangle') {
                        clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
                      } else if (element.shape === 'star') {
                        clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                      } else if (element.shape === 'arrow') {
                        clipPath = 'polygon(0% 30%, 60% 30%, 60% 0%, 100% 50%, 60% 100%, 60% 70%, 0% 70%)';
                      }
                      
                      const shapeStyle = {
                        ...previewStyle,
                        background: element.fillColor || '#e5e7eb',
                        border: clipPath === 'none' ? `${0.5 * scale}px solid ${element.borderColor || '#9ca3af'}` : 'none',
                        borderRadius: borderRadius,
                        clipPath: clipPath
                      };
                      return <div key={element.id} style={shapeStyle}></div>;
                    }

                    if (element.type === 'chart') {
                      const chartType = element.chartType || 'bar';
                      const chartData = Array.isArray(element.data) ? element.data : [];
                      const series = Array.isArray(element.series) ? element.series : [];
                      const chartWidth = (element.width || 260) * scale;
                      const chartHeight = (element.height || 180) * scale;
                      
                      const chartStyle = {
                        ...previewStyle,
                        background: element.background || '#ffffff',
                        border: '0.5px solid #d1d5db',
                        borderRadius: '1px',
                        padding: '1px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        boxSizing: 'border-box'
                      };
                      
                      const innerWidth = Math.max(10, chartWidth - 4);
                      const innerHeight = Math.max(10, chartHeight - 6);
                      
                      // Always try to render - show icon only if rendering fails
                      const hasData = chartData.length > 0 && series.length > 0;
                      
                      try {
                        return (
                          <div key={element.id} style={chartStyle}>
                          {chartType === 'pie' ? (
                            (() => {
                              if (!hasData || chartData.length === 0) {
                                return (
                                  <div style={{
                                    width: `${Math.min(innerHeight, innerWidth) * 0.85}px`,
                                    height: `${Math.min(innerHeight, innerWidth) * 0.85}px`,
                                    borderRadius: '50%',
                                    background: 'conic-gradient(#3b82f6 0deg 140deg, #f97316 140deg 260deg, #34d399 260deg 360deg)'
                                  }}></div>
                                );
                              }
                              
                              // Calculate actual pie percentages from data
                              const total = chartData.reduce((sum, point) => {
                                const pointSum = Object.values(point.values || {}).reduce((s, v) => s + (Number(v) || 0), 0);
                                return sum + pointSum;
                              }, 0) || 1;
                              
                              let currentAngle = 0;
                              const segments = chartData.map((point, i) => {
                                const value = Object.values(point.values || {})[0] || 0;
                                const percentage = (value / total) * 360;
                                const color = series[i % series.length]?.color || '#3b82f6';
                                const start = currentAngle;
                                currentAngle += percentage;
                                return `${color} ${start}deg ${currentAngle}deg`;
                              }).join(', ');
                              
                              return (
                                <div style={{
                                  width: `${Math.min(innerHeight, innerWidth) * 0.85}px`,
                                  height: `${Math.min(innerHeight, innerWidth) * 0.85}px`,
                                  borderRadius: '50%',
                                  background: `conic-gradient(${segments})`
                                }}></div>
                              );
                            })()
                          ) : chartType === 'line' || chartType === 'area' ? (
                            (() => {
                              if (!hasData || chartData.length === 0) {
                                return (
                                  <svg width={innerWidth} height={innerHeight}>
                                    <polyline
                                      points={`0,${innerHeight-2} ${innerWidth*0.25},${innerHeight*0.5} ${innerWidth*0.5},${innerHeight*0.7} ${innerWidth*0.75},${innerHeight*0.35} ${innerWidth},${innerHeight*0.55}`}
                                      fill={chartType === 'area' ? '#3b82f680' : 'none'}
                                      stroke="#3b82f6"
                                      strokeWidth="1"
                                    />
                                  </svg>
                                );
                              }
                              
                              // Get actual values for first series
                              const seriesId = series[0]?.id;
                              const values = chartData.map(point => Number(point.values?.[seriesId]) || 0);
                              const maxValue = Math.max(...values, 1);
                              
                              const points = values.map((value, i) => {
                                const x = (i / Math.max(values.length - 1, 1)) * innerWidth;
                                const y = innerHeight - ((value / maxValue) * (innerHeight - 4)) - 2;
                                return `${x},${y}`;
                              }).join(' ');
                              
                              return (
                                <svg width={innerWidth} height={innerHeight} style={{ display: 'block' }}>
                                  <polyline
                                    points={points}
                                    fill={chartType === 'area' ? (series[0]?.color || '#3b82f6') + '40' : 'none'}
                                    stroke={series[0]?.color || '#3b82f6'}
                                    strokeWidth="1"
                                  />
                                </svg>
                              );
                            })()
                          ) : (
                            (() => {
                              if (!hasData || chartData.length === 0) {
                                return (
                                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: innerHeight, width: innerWidth, justifyContent: 'space-evenly' }}>
                                    {[0.65, 0.85, 0.55, 0.90, 0.70].map((ratio, i) => (
                                      <div key={i} style={{
                                        flex: 1,
                                        height: `${innerHeight * ratio}px`,
                                        background: '#3b82f6',
                                        borderRadius: '0.5px'
                                      }}></div>
                                    ))}
                                  </div>
                                );
                              }
                              
                              // Get max value across all series for proper scaling
                              const allValues = chartData.flatMap(point =>
                                series.map(s => Number(point.values?.[s.id]) || 0)
                              );
                              const maxValue = Math.max(...allValues, 1);
                              
                              const barWidth = Math.max(2, innerWidth / (chartData.length * series.length + chartData.length));
                              const gap = barWidth * 0.15;
                              
                              return (
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: `${gap}px`, height: innerHeight, width: innerWidth, justifyContent: 'space-evenly' }}>
                                  {chartData.map((point, pointIndex) => (
                                    <div key={pointIndex} style={{ display: 'flex', alignItems: 'flex-end', gap: `${gap * 0.5}px` }}>
                                      {series.map((s, seriesIndex) => {
                                        const value = Number(point.values?.[s.id]) || 0;
                                        const height = Math.max(1, (value / maxValue) * (innerHeight - 2));
                                        return (
                                          <div
                                            key={`${pointIndex}-${seriesIndex}`}
                                            style={{
                                              width: `${barWidth}px`,
                                              height: `${height}px`,
                                              background: s.color || '#3b82f6',
                                              borderRadius: '0.5px'
                                            }}
                                          ></div>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              );
                            })()
                          )}
                        </div>
                        );
                      } catch (error) {
                        // Render simple generic chart on error
                        return (
                          <div key={element.id} style={chartStyle}>
                            {chartType === 'pie' ? (
                              <div style={{
                                width: `${Math.min(innerHeight, innerWidth) * 0.85}px`,
                                height: `${Math.min(innerHeight, innerWidth) * 0.85}px`,
                                borderRadius: '50%',
                                background: 'conic-gradient(#3b82f6 0deg 120deg, #f97316 120deg 240deg, #34d399 240deg 360deg)'
                              }}></div>
                            ) : chartType === 'line' || chartType === 'area' ? (
                              <svg width={innerWidth} height={innerHeight}>
                                <polyline
                                  points={`0,${innerHeight-2} ${innerWidth*0.25},${innerHeight*0.5} ${innerWidth*0.5},${innerHeight*0.7} ${innerWidth*0.75},${innerHeight*0.35} ${innerWidth},${innerHeight*0.55}`}
                                  fill={chartType === 'area' ? '#3b82f680' : 'none'}
                                  stroke="#3b82f6"
                                  strokeWidth="1"
                                />
                              </svg>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: innerHeight, width: innerWidth, justifyContent: 'space-evenly' }}>
                                {[0.65, 0.85, 0.55, 0.90, 0.70].map((ratio, i) => (
                                  <div key={i} style={{
                                    flex: 1,
                                    height: `${innerHeight * ratio}px`,
                                    background: '#3b82f6',
                                    borderRadius: '0.5px'
                                  }}></div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }

                    if (element.type === 'image') {
                      const imageContainerStyle = {
                        ...previewStyle,
                        overflow: 'hidden',
                        border: '0.5px solid #d1d5db',
                        borderRadius: '1px',
                        background: '#f0f0f0'
                      };
                      
                      return (
                        <div key={element.id} style={imageContainerStyle}>
                          {element.src ? (
                            <img 
                              src={element.src} 
                              alt=""
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '6px',
                              color: '#999'
                            }}>
                              🖼️
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })
                ) : (
                  <span className="slide-card-preview-placeholder">Empty slide</span>
                )}
              </div>
            </div>
          );
        })}
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
