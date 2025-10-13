import PptxGenJS from 'pptxgenjs';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const SLIDE_WIDTH_IN = 10;
const SLIDE_HEIGHT_IN = 5.625;

const pxToInches = (value, axis = 'x') => {
  const numeric = Number(value) || 0;
  const base = axis === 'x' ? CANVAS_WIDTH : CANVAS_HEIGHT;
  const slideBase = axis === 'x' ? SLIDE_WIDTH_IN : SLIDE_HEIGHT_IN;
  const inches = (numeric / base) * slideBase;
  return Number.isFinite(inches) ? Number(inches.toFixed(2)) : 0;
};

const normalizeHex = (input, fallback = 'FFFFFF') => {
  if (!input) {
    return fallback;
  }
  const hex = String(input).replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return fallback;
  }
  return hex.toUpperCase();
};

const getSlideBackground = (slide) => {
  if (!slide) {
    return 'FFFFFF';
  }
  if (typeof slide.background === 'string') {
    return slide.background;
  }
  if (slide.background && typeof slide.background === 'object') {
    return slide.background.color || slide.background.fill || 'FFFFFF';
  }
  return 'FFFFFF';
};

const determineFontFace = (fontFamily) => {
  if (!fontFamily) {
    return 'Segoe UI';
  }
  return fontFamily.split(',')[0].replace(/["']/g, '').trim() || 'Segoe UI';
};

const getTextOptions = (item) => {
  const fontSize = Number(item.fontSize) || 18;
  return {
    x: pxToInches(item.x || 0, 'x'),
    y: pxToInches(item.y || 0, 'y'),
    w: pxToInches(item.width || CANVAS_WIDTH * 0.6, 'x'),
    h: pxToInches(item.height || CANVAS_HEIGHT * 0.2, 'y'),
    fontSize: Math.max(10, Math.round(fontSize * 0.75)),
    fontFace: determineFontFace(item.fontFamily),
    color: normalizeHex(item.color, 'F5F5F5'),
    align: (item.textAlign || 'left').toLowerCase(),
    bold: Boolean(item.bold || (item.fontWeight && Number(item.fontWeight) >= 600)),
    italic: Boolean(item.italic),
    underline: Boolean(item.underline),
    lineSpacingMultiple: 1.2
  };
};

const addTextElements = (pptSlide, slide) => {
  (slide?.content || []).forEach((item) => {
    if (item?.type !== 'text') {
      return;
    }
    const text = item.text?.trim();
    if (!text) {
      return;
    }
    pptSlide.addText(text, getTextOptions(item));
  });
};

export const exportSlidesAsPptx = async (slides, fileName) => {
  if (typeof PptxGenJS !== 'function') {
    throw new Error('Unable to load PowerPoint exporter. Please refresh and try again.');
  }

  const pptx = new PptxGenJS();

  (slides || []).forEach((slide) => {
    const pptSlide = pptx.addSlide({
      bkgd: normalizeHex(getSlideBackground(slide))
    });
    addTextElements(pptSlide, slide);
  });

  const timestamp = new Date().toISOString().split('T')[0];
  const desiredName = fileName || `presentation-${timestamp}.pptx`;
  await pptx.writeFile({ fileName: desiredName });
};
