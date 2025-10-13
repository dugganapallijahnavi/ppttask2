export const CHART_COLORS = [
  '#111111',
  '#2d2d2d',
  '#515151',
  '#6b6b6b',
  '#868686',
  '#a3a3a3',
  '#c7c7c7',
  '#e5e5e5'
];

export const CHART_TYPE_OPTIONS = [
  { key: 'bar', label: 'Bar' },
  { key: 'area', label: 'Area' },
  { key: 'pie', label: 'Pie' },
  { key: 'columnLine', label: 'Column + Line' }
];

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const baseTemplates = {
  bar: {
    type: 'bar',
    title: 'Session Duration',
    categories: ['Social', 'Direct', 'Email', 'Referrals'],
    series: [
      {
        name: 'Minutes',
        data: [22, 35, 19, 28],
        visual: 'bar'
      }
    ]
  },
  area: {
    type: 'area',
    title: 'Traffic Sources',
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      {
        name: 'Organic',
        data: [18, 28, 22, 32, 24],
        visual: 'area',
        color: '#2d2d2d'
      },
      {
        name: 'Paid',
        data: [12, 18, 15, 20, 17],
        visual: 'area',
        color: '#515151'
      },
      {
        name: 'Referral',
        data: [8, 12, 10, 14, 12],
        visual: 'area',
        color: '#6b6b6b'
      }
    ]
  },
  pie: {
    type: 'pie',
    title: 'Audience Mix',
    categories: ['Desktop', 'Mobile', 'Tablet', 'Smart TV'],
    series: [
      {
        name: 'Share',
        data: [45, 30, 15, 10],
        visual: 'pie'
      }
    ]
  },
  columnLine: {
    type: 'columnLine',
    title: 'Campaign Performance',
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      {
        name: 'Reach',
        data: [32, 48, 42, 54],
        visual: 'column',
        color: '#2d2d2d'
      },
      {
        name: 'Engagement',
        data: [28, 36, 30, 44],
        visual: 'column',
        color: '#515151'
      },
      {
        name: 'Conversion',
        data: [18, 26, 24, 32],
        visual: 'line',
        color: '#6b6b6b'
      }
    ]
  }
};

export const getDefaultChartData = (type = 'column') => {
  const template = baseTemplates[type] || baseTemplates.column;
  return deepClone(template);
};

export const normalizeChartData = (chartData) => {
  if (!chartData || !chartData.type) {
    return getDefaultChartData();
  }

  const template = getDefaultChartData(chartData.type);
  const categories = Array.isArray(chartData.categories) && chartData.categories.length
    ? chartData.categories
    : template.categories;

  const series = Array.isArray(chartData.series) && chartData.series.length
    ? chartData.series.map((seriesItem, index) => {
        const templateSeries = template.series[index] || template.series[template.series.length - 1];
        const data = Array.isArray(seriesItem.data) && seriesItem.data.length
          ? seriesItem.data
          : templateSeries.data;

        return {
          ...templateSeries,
          ...seriesItem,
          data: data.slice(0, categories.length).concat(Array(Math.max(categories.length - data.length, 0)).fill(0))
        };
      })
    : template.series;

  return {
    ...template,
    ...chartData,
    categories,
    series
  };
};

export const cloneChartData = (chartData) => deepClone(chartData);
