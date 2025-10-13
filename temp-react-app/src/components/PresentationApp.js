import React, { useMemo, useState } from 'react';
import Toolbar from './Toolbar';
import SlidePanel from './SlidePanel';
import SlideEditor from './SlideEditor';
import Slideshow from './Slideshow';
import './PresentationApp.css';
import {
  createSlideFromLayout,
  DEFAULT_LAYOUT_ID
} from '../data/slideLayouts';
import { exportSlidesAsPptx } from '../utils/pptxExport';
import { BACKGROUND_COLOR_OPTIONS, THEME_PRESETS } from '../constants/presets';

const createInitialSlides = () => {
  const firstLayout = createSlideFromLayout(DEFAULT_LAYOUT_ID);
  const secondLayout = createSlideFromLayout('titleAndContent');
  const thirdLayout = createSlideFromLayout('twoColumn');

  const firstSlide = {
    id: 1,
    title: 'Slide 1',
    content: firstLayout.content.map((element, index) => {
      if (element.type !== 'text') {
        return element;
      }
      if (index === 0) {
        return { ...element, text: 'Welcome to your presentation' };
      }
      if (index === 1) {
        return { ...element, text: 'Use the layout picker to get started quickly.' };
      }
      return element;
    }),
    background: firstLayout.background
  };

  const secondSlide = {
    id: 2,
    title: 'Slide 2',
    content: secondLayout.content.map((element, index) => {
      if (element.type !== 'text') {
        return element;
      }
      if (index === 0) {
        return { ...element, text: 'Outline the key idea you want to share' };
      }
      if (index === 1) {
        return {
          ...element,
          text: 'Summarize your story in a few lines so your audience knows where you are headed.'
        };
      }
      return element;
    }),
    background: secondLayout.background
  };

  const thirdSlide = {
    id: 3,
    title: 'Slide 3',
    content: thirdLayout.content.map((element, index) => {
      if (element.type !== 'text') {
        return element;
      }
      if (index === 0) {
        return { ...element, text: 'Add supporting details and visuals' };
      }
      if (index === 1) {
        return {
          ...element,
          text: 'List supporting points that reinforce your idea.'
        };
      }
      if (index === 2) {
        return {
          ...element,
          text: 'Include data, quotes, or anecdotes that add credibility.'
        };
      }
      return element;
    }),
    background: thirdLayout.background
  };

  return [firstSlide, secondSlide, thirdSlide];
};

const PresentationApp = () => {
  const [slides, setSlides] = useState(createInitialSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [insertAction, setInsertAction] = useState(null);
  const [activeThemeId, setActiveThemeId] = useState(THEME_PRESETS[0]?.id ?? null);
  const presentationPayload = useMemo(
    () => ({
      version: 1,
      slides
    }),
    [slides]
  );
  const presentationSnapshot = useMemo(
    () => JSON.stringify(presentationPayload, null, 2),
    [presentationPayload]
  );

  const addSlide = (layoutId = DEFAULT_LAYOUT_ID) => {
    const layoutResult = createSlideFromLayout(layoutId);
    setSlides((previousSlides) => {
      const newIndex = previousSlides.length + 1;
      const newSlide = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: `Slide ${newIndex}`,
        content: layoutResult.content,
        background: layoutResult.background
      };
      const updatedSlides = [...previousSlides, newSlide];
      setCurrentSlide(updatedSlides.length - 1);
      return updatedSlides;
    });
  };

  const deleteSlide = (index) => {
    if (slides.length > 1) {
      const newSlides = slides.filter((_, i) => i !== index);
      setSlides(newSlides);
      if (currentSlide >= newSlides.length) {
        setCurrentSlide(newSlides.length - 1);
      }
    }
  };

  const moveSlide = (fromIndex, direction) => {
    setSlides((previousSlides) => {
      const targetIndex = fromIndex + direction;
      if (
        targetIndex < 0 ||
        targetIndex >= previousSlides.length ||
        fromIndex < 0 ||
        fromIndex >= previousSlides.length
      ) {
        return previousSlides;
      }

      const reordered = [...previousSlides];
      const [movedSlide] = reordered.splice(fromIndex, 1);
      reordered.splice(targetIndex, 0, movedSlide);

      setCurrentSlide((previousCurrent) => {
        if (previousCurrent === fromIndex) {
          return targetIndex;
        }
        if (previousCurrent === targetIndex) {
          return previousCurrent - direction;
        }
        return previousCurrent;
      });

      return reordered;
    });
  };

  const updateSlide = (index, updatedSlide) => {
    const newSlides = [...slides];
    newSlides[index] = updatedSlide;
    setSlides(newSlides);
  };

  const currentBackground =
    slides[currentSlide]?.background ?? BACKGROUND_COLOR_OPTIONS[0];

  const handleBackgroundSelect = (color) => {
    if (!color) {
      return;
    }

    setSlides((previousSlides) => {
      if (!previousSlides[currentSlide]) {
        return previousSlides;
      }
      const updatedSlides = [...previousSlides];
      updatedSlides[currentSlide] = {
        ...updatedSlides[currentSlide],
        background: color
      };
      return updatedSlides;
    });
    setActiveThemeId(null);
  };

  const handleThemeSelect = (themeId) => {
    const theme = THEME_PRESETS.find((option) => option.id === themeId);
    if (!theme) {
      return;
    }

    setSlides((previousSlides) =>
      previousSlides.map((slide) => ({
        ...slide,
        background: theme.background,
        content: slide.content.map((item) => {
          if (item.type === 'text') {
            return { ...item, color: theme.textColor ?? item.color };
          }
          return item;
        })
      }))
    );
    setActiveThemeId(themeId);
  };

  const downloadPresentationAsJson = () => {
    try {
      const blob = new Blob([presentationSnapshot], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `presentation-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { status: 'success' };
    } catch (error) {
      return {
        status: 'error',
        message: error?.message || 'Unable to download presentation.'
      };
    }
  };

  const downloadPresentationAsPptx = async () => {
    try {
      await exportSlidesAsPptx(slides);
      return { status: 'success' };
    } catch (error) {
      return {
        status: 'error',
        message: error?.message || 'Unable to generate PPTX.'
      };
    }
  };

  const importPresentationFromFile = async (file) => {
    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error('Selected file is not a valid presentation export.');
    }

    const incomingSlides = Array.isArray(parsed?.slides)
      ? parsed.slides
      : Array.isArray(parsed)
      ? parsed
      : null;

    if (!incomingSlides || incomingSlides.length === 0) {
      throw new Error('File does not contain any slides.');
    }

    const normalizedSlides = incomingSlides.map((slide, index) => {
      const fallbackId = Date.now() + index;
      const normalisedContent = Array.isArray(slide.content)
        ? slide.content.map((item, itemIndex) => ({
            ...item,
            id:
              item?.id ??
              `imported-${fallbackId}-${itemIndex}-${Math.random()
                .toString(16)
                .slice(2)}`
          }))
        : [];

      return {
        id: slide?.id ?? fallbackId,
        title: slide?.title || `Slide ${index + 1}`,
        content: normalisedContent,
        background:
          typeof slide?.background === 'string' ? slide.background : '#050505'
      };
    });

    setSlides(normalizedSlides);
    setCurrentSlide(0);
    setActiveThemeId(null);

    return { status: 'success', count: normalizedSlides.length };
  };

  return (
    <div className="presentation-app">
      {!isSlideshow ? (
        <>
          <Toolbar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            onInsertSelect={setInsertAction}
            onPreview={() => setIsSlideshow(true)}
            onSavePpt={downloadPresentationAsPptx}
            onSaveJson={downloadPresentationAsJson}
            onOpenJson={importPresentationFromFile}
            backgroundOptions={BACKGROUND_COLOR_OPTIONS}
            selectedBackground={currentBackground}
            onSelectBackground={handleBackgroundSelect}
            themeOptions={THEME_PRESETS}
            selectedThemeId={activeThemeId}
            onSelectTheme={handleThemeSelect}
          />
          <div className="main-content">
            <SlidePanel 
              slides={slides}
              currentSlide={currentSlide}
              setCurrentSlide={setCurrentSlide}
              addSlide={addSlide}
              deleteSlide={deleteSlide}
              moveSlide={moveSlide}
            />
            <SlideEditor 
              slide={slides[currentSlide]}
              updateSlide={(updatedSlide) => updateSlide(currentSlide, updatedSlide)}
              insertAction={insertAction}
              onInsertActionHandled={() => setInsertAction(null)}
            />
          </div>
        </>
      ) : (
        <Slideshow
          slides={slides}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          onExit={() => setIsSlideshow(false)}
        />
      )}
    </div>
  );
};

export default PresentationApp;
