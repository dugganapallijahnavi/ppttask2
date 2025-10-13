import React, { useState, useEffect } from 'react';
import './Slideshow.css';

const PIE_COLORS = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#c084fc', '#f472b6'];

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

const renderChartVisual = (chart) => {
  const data = chart.data && chart.data.length ? chart.data : [];
  if (!data.length) {
    return (
      <div className="chart-empty">
        Add data rows to populate this chart.
        <br />
        You can add data rows by clicking the "Add Row" button in the
        chart editor.
      </div>
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
      return (
        <circle key={point.id || idx} cx={x} cy={y} r={2.8} fill={accentColor} />
      );
    });

    const gradientId = `chartAreaGradient-${chart.id ?? 'preview'}`;
    const polygonPoints =
      chart.chartType === 'area' ? `0,100 ${points} 100,100` : null;

    return (
      <div className="chart-visual chart-visual-line">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hexToRgba(accentColor, 0.45)} />
              <stop offset="100%" stopColor={hexToRgba(accentColor, 0.05)} />
            </linearGradient>
          </defs>
          {chart.chartType === 'area' && (
            <polygon
              points={polygonPoints}
              fill={`url(#${gradientId})`}
              stroke="none"
            />
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
      </div>
    );
  }

  return (
    <div className="chart-visual chart-visual-bar">
      {data.map((point, idx) => {
        const value = Number(point.value) || 0;
        const height = Math.max((value / maxValue) * 100, 6);
        return (
          <div key={point.id || idx} className="chart-bar">
            <div
              className="chart-bar-fill"
              style={{ height: `${height}%`, backgroundColor: accentColor }}
            />
          </div>
        );
      })}
    </div>
  );
};

const Slideshow = ({ slides, currentSlide, setCurrentSlide, onExit }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedChartData, setSelectedChartData] = useState(null);

  const handleChartClick = (chart) => {
    setSelectedChartData(chart);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          nextSlide();
          break;
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'Escape':
          onExit();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, slides.length]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="slideshow-container">
      <div className="slideshow-header">
        <div className="slideshow-controls">
          <button onClick={prevSlide} disabled={currentSlide === 0}>
            Previous
          </button>
          <span className="slide-counter">
            {currentSlide + 1} / {slides.length}
          </span>
          <button onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
            Next
          </button>
        </div>
        <div className="slideshow-actions">
          <button onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
          <button onClick={onExit}>Exit</button>
        </div>
      </div>

      <div className="slideshow-slide" style={{ backgroundColor: slide.background }}>
        <div className="slide-content-container">
          {slide.content.map((element) => (
            <div key={element.id}>
              {element.type === 'text' && (
                <div
                  className="slideshow-text-element"
                  style={{
                    left: `${(element.x / 800) * 100}%`,
                    top: `${(element.y / 600) * 100}%`,
                    width: `${(element.width / 800) * 100}%`,
                    height: `${(element.height / 600) * 100}%`,
                    fontSize: `${element.fontSize * 1.5}px`,
                    fontFamily: element.fontFamily,
                    color: element.color,
                    fontWeight: element.bold ? 'bold' : 'normal',
                    fontStyle: element.italic ? 'italic' : 'normal',
                    textDecoration: element.underline ? 'underline' : 'none'
                  }}
                >
                  {element.text}
                </div>
              )}

              {element.type === 'shape' && (
                <div
                  className="slideshow-shape-element"
                  style={{
                    left: `${(element.x / 800) * 100}%`,
                    top: `${(element.y / 600) * 100}%`,
                    width: `${(element.width / 800) * 100}%`,
                    height: `${(element.height / 600) * 100}%`,
                    backgroundColor: element.color,
                    border: `${element.borderWidth}px solid ${element.borderColor}`,
                    borderRadius: element.shape === 'circle' ? '50%' : '0'
                  }}
                />
              )}

              {element.type === 'image' && (
                <div
                  className="slideshow-image-element"
                  style={{
                    left: `${(element.x / 800) * 100}%`,
                    top: `${(element.y / 600) * 100}%`,
                    width: `${((element.width || 240) / 800) * 100}%`,
                    height: `${((element.height || 160) / 600) * 100}%`
                  }}
                >
                  <img src={element.src} alt={element.alt || ''} />
                </div>
              )}

              {element.type === 'chart' && (
                <div
                  className="chart-element slideshow-chart-element"
                  style={{
                    left: `${(element.x / 800) * 100}%`,
                    top: `${(element.y / 600) * 100}%`,
                    width: `${(element.width / 800) * 100}%`,
                    height: `${(element.height / 600) * 100}%`,
                    background:
                      element.background ||
                      hexToRgba(element.accentColor || '#1a73e8', 0.12),
                    color: element.accentColor || '#1a73e8',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleChartClick(element)}
                >
                  <div className="chart-placeholder">{renderChartVisual(element)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chart Data Modal */}
      {selectedChartData && (
        <div className="chart-data-modal" onClick={() => setSelectedChartData(null)}>
          <div className="chart-data-content" onClick={(e) => e.stopPropagation()}>
            <div className="chart-data-header">
              <h3>{selectedChartData.chartType?.toUpperCase()} Chart Data</h3>
              <button
                className="close-button"
                onClick={() => setSelectedChartData(null)}
              >
                ×
              </button>
            </div>
            <div className="chart-data-body">
              {selectedChartData.data && selectedChartData.data.length > 0 ? (
                <div className="data-list">
                  {selectedChartData.data.map((point, idx) => (
                    <div key={point.id || idx} className="data-item">
                      <span className="data-label">{point.label || `Item ${idx + 1}`}</span>
                      <span className="data-value">{point.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No data available for this chart</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="slideshow-footer">
        <div className="keyboard-shortcuts">
          <span>Use arrow keys or spacebar to navigate - F for fullscreen - ESC to exit</span>
        </div>
      </div>
    </div>
  );
};

export default Slideshow;
