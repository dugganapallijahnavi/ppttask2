import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartComponent = ({ type = 'bar', data, options = {}, style }) => {
  const sanitizedData = useMemo(() => {
    if (!data || !Array.isArray(data.labels) || !Array.isArray(data.datasets)) {
      return {
        labels: [],
        datasets: []
      };
    }

    const datasets = data.datasets.map((dataset, index) => {
      const baseColor = dataset.color || dataset.backgroundColor || `#3b82f6`;
      const normalizedData = Array.isArray(dataset.data)
        ? dataset.data
        : Array.isArray(data.labels)
        ? data.labels.map(() => 0)
        : [];

      const isLineVariant = dataset.variant === 'line' || type === 'line';
      const isAreaVariant = dataset.variant === 'area';
      const isPieVariant = type === 'pie';

      return {
        ...dataset,
        label: dataset.label || `Series ${index + 1}`,
        data: normalizedData,
        backgroundColor: isPieVariant
          ? dataset.segmentColors || normalizedData.map(() => baseColor)
          : isAreaVariant
          ? dataset.backgroundColor || baseColor + '33'
          : dataset.backgroundColor || baseColor,
        borderColor: dataset.borderColor || baseColor,
        borderWidth: dataset.borderWidth ?? (isLineVariant ? 2 : 1),
        fill: isAreaVariant || dataset.fill || false,
        tension: dataset.tension ?? (isLineVariant ? 0.35 : 0.1),
        pointRadius: dataset.pointRadius ?? (isLineVariant ? 3 : 0),
        pointHoverRadius: dataset.pointHoverRadius ?? (isLineVariant ? 5 : 3),
        pointBackgroundColor: dataset.pointBackgroundColor || baseColor
        ,
        type: dataset.type || (dataset.variant === 'line' ? 'line' : undefined)
      };
    });

    return {
      labels: data.labels,
      datasets
    };
  }, [data, type]);

  const mergedOptions = useMemo(() => {
    const defaults = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      animations: false,
      transitions: {
        active: {
          animation: {
            duration: 0
          }
        }
      },
      responsiveAnimationDuration: 0,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 16
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales:
        type === 'pie'
          ? {}
          : {
              x: {
                grid: {
                  display: false
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(148, 163, 184, 0.2)'
                }
              }
            }
    };

    return {
      ...defaults,
      ...options,
      plugins: {
        ...defaults.plugins,
        ...(options.plugins || {})
      },
      scales: {
        ...(defaults.scales || {}),
        ...(options.scales || {})
      }
    };
  }, [options, type]);

  const renderChart = () => {
    const chartProps = {
      data: sanitizedData,
      options: mergedOptions
    };

    switch (type) {
      case 'line':
      case 'area':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'bar':
      case 'column':
      case 'columnLine':
      default:
        return <Bar {...chartProps} />;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', ...(style || {}) }}>
      {renderChart()}
    </div>
  );
};

export default React.memo(ChartComponent, (prevProps, nextProps) => {
  // Deep comparison for chart data to prevent unnecessary re-renders
  const prevData = prevProps.data;
  const nextData = nextProps.data;
  
  if (prevProps.type !== nextProps.type) return false;
  
  // Check labels
  if (JSON.stringify(prevData?.labels) !== JSON.stringify(nextData?.labels)) return false;
  
  // Check datasets
  if (prevData?.datasets?.length !== nextData?.datasets?.length) return false;
  
  // Check each dataset
  for (let i = 0; i < (prevData?.datasets?.length || 0); i++) {
    const prevDataset = prevData.datasets[i];
    const nextDataset = nextData.datasets[i];
    
    if (prevDataset?.label !== nextDataset?.label) return false;
    if (prevDataset?.color !== nextDataset?.color) return false;
    if (JSON.stringify(prevDataset?.data) !== JSON.stringify(nextDataset?.data)) return false;
  }
  
  return true;
});
