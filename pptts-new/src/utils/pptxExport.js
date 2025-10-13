// Using CDN version of pptxgenjs
const PptxGenJS = window.PptxGenJS;

// Check if PptxGenJS is available
if (!PptxGenJS) {
  console.error('PptxGenJS is not loaded. Make sure the CDN script is included in your HTML.');
  throw new Error('PptxGenJS not loaded');
}

const DEFAULT_TITLE_BOX = {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 1.2,
  fontSize: 32,
  bold: true,
  color: '1F2937'
};

const DEFAULT_BODY_BOX = {
  x: 0.75,
  y: 2,
  w: 8.5,
  fontSize: 20,
  lineSpacingMultiple: 1.15,
  color: '1F2937'
};

const getSlideBackground = (slide) => {
  if (slide?.background && /^#?[0-9a-f]{6}$/i.test(slide.background)) {
    return slide.background.startsWith('#') ? slide.background.slice(1) : slide.background;
  }
  return 'FFFFFF';
};

const collectTextItems = (slide) =>
  (slide?.content || []).filter((item) => item?.type === 'text' && item.text?.trim());

// Export function to create a PowerPoint presentation
export const exportSlidesAsPptx = async (slides, fileName) => {
  try {
    if (!PptxGenJS) {
      throw new Error('PptxGenJS not loaded. Please check your internet connection and try again.');
    }
    
    if (typeof PptxGenJS !== 'function') {
      throw new Error('pptxgenjs library failed to load.');
    }

    const pptx = new PptxGenJS();

    (slides || []).forEach((slide, index) => {
      const slideBackground = getSlideBackground(slide);
      const pptSlide = pptx.addSlide({ bkgd: slideBackground });

      const titleText = slide?.title?.trim();
      if (titleText) {
        pptSlide.addText(titleText, DEFAULT_TITLE_BOX);
      } else {
        pptSlide.addText(`Slide ${index + 1}`, DEFAULT_TITLE_BOX);
      }

      const textItems = collectTextItems(slide);
      if (textItems.length > 0) {
        const bulletText = textItems.map((item) => item.text.trim()).join('\n');
        pptSlide.addText(bulletText, {
          ...DEFAULT_BODY_BOX,
          bullet: textItems.length > 1
        });
      }
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const targetName = fileName || `presentation-${timestamp}.pptx`;
    
    try {
      await pptx.writeFile({ fileName: targetName });
      console.log('Presentation exported successfully:', targetName);
    } catch (error) {
      console.error('Error exporting presentation:', error);
      throw new Error('Failed to save presentation. Please try again.');
    }
  } catch (error) {
    console.error('Error in exportSlidesAsPptx:', error);
    throw error; // Re-throw to allow handling by the caller
  }
};
