# 📦 Styled Text Container - Complete Documentation

## Overview
A production-ready text container component that ensures text always remains fully visible, wraps naturally, and never spills outside its boundaries.

---

## 🎯 Key Features

✅ **Perfect Text Containment** - Text never overflows the box  
✅ **Smart Word Wrapping** - No mid-word breaks (e.g., "supporti ng")  
✅ **Multiple Display Modes** - Wrap, Ellipsis, Auto-resize  
✅ **Responsive Design** - Adapts to all screen sizes  
✅ **Accessible** - WCAG compliant with proper contrast  
✅ **Customizable** - Multiple themes and sizes  

---

## 📋 CSS Properties Explained

### Essential Properties for Text Containment

| Property | Value | Purpose |
|----------|-------|---------|
| `box-sizing` | `border-box` | Includes padding in width/height calculations |
| `white-space` | `normal` | Allows text to wrap onto multiple lines |
| `overflow-wrap` | `break-word` | Breaks long words if they overflow |
| `word-wrap` | `break-word` | Legacy support for `overflow-wrap` |
| `word-break` | `normal` | Prevents breaking words mid-character |
| `hyphens` | `auto` | Adds hyphens when breaking words |
| `line-height` | `1.4` | Comfortable spacing between lines |

### Why These Properties Matter

**`box-sizing: border-box`**
- Without this, padding adds to the total width, causing unexpected overflow
- Ensures the box stays within its defined dimensions

**`white-space: normal`**
- Allows text to wrap instead of extending horizontally
- Critical for multi-line text display

**`overflow-wrap: break-word`**
- Breaks extremely long words (like URLs) that can't fit
- Prevents horizontal overflow

**`word-break: normal`**
- Keeps words intact when possible
- Prevents awkward mid-character breaks

**`hyphens: auto`**
- Improves readability when words must break
- Requires `lang` attribute on HTML element

---

## 🎨 Display Modes

### 1. Wrap Mode (Default)
Text wraps naturally without any truncation.

```css
.text-box--wrap {
  min-height: 3rem;
  height: auto;
  overflow: visible;
}
```

**Use when:** Content length varies and all text must be visible

### 2. Ellipsis Mode
Truncates text after a specified number of lines with "..."

```css
.text-box--ellipsis {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Use when:** You need consistent height and can truncate content

### 3. Auto-Resize Mode
Dynamically adjusts font size to fit all content

```javascript
function autoResizeText(element, minSize = 12, maxSize = 20) {
  let fontSize = maxSize;
  element.style.fontSize = fontSize + 'px';
  
  while ((element.scrollHeight > element.clientHeight) && 
         fontSize > minSize) {
    fontSize -= 0.5;
    element.style.fontSize = fontSize + 'px';
  }
}
```

**Use when:** Fixed container size but all content must be visible

---

## 🚀 Implementation Examples

### React Component
```jsx
import StyledTextContainer from './StyledTextContainer';

<StyledTextContainer 
  text="Your subtitle here"
  mode="wrap"
  className="custom-class"
/>
```

### Plain HTML/CSS
```html
<div class="text-box text-box--wrap">
  Your subtitle here
</div>
```

### Tailwind CSS
```jsx
<div className="max-w-sm px-4 py-3.5 bg-white border-2 border-blue-300 
  rounded-xl shadow-lg font-serif text-xl font-semibold text-gray-800 
  text-center leading-snug whitespace-normal break-words hyphens-auto">
  Your subtitle here
</div>
```

---

## 📱 Responsive Behavior

### Desktop (> 768px)
- Max width: 22rem (352px)
- Font size: 1.25rem (20px)
- Full padding: 0.875rem 1rem

### Tablet (≤ 768px)
- Max width: 18rem (288px)
- Font size: 1.125rem (18px)
- Reduced padding: 0.75rem 0.875rem

### Mobile (≤ 480px)
- Max width: 100% (with margins)
- Font size: 1rem (16px)
- Minimal padding: 0.625rem 0.75rem

---

## ♿ Accessibility Features

### Color Contrast
- Text color: `#1a202c` on white background
- Contrast ratio: 16.1:1 (WCAG AAA compliant)

### Keyboard Navigation
```css
.text-box:focus {
  outline: 2px solid #4299e1;
  outline-offset: 2px;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .text-box {
    transition: none;
    transform: none !important;
  }
}
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .text-box {
    border-width: 2px;
    border-color: #000000;
  }
}
```

---

## 🎨 Theme Variations

### Purple Theme
```css
background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
border-color: #a78bfa;
color: #5b21b6;
```

### Gradient Theme
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border-color: #667eea;
color: #ffffff;
```

### Minimal Theme
```css
background: #f8fafc;
border: 1px solid #cbd5e1;
color: #334155;
```

### Bold Theme
```css
background: #1a202c;
border-color: #2d3748;
color: #ffffff;
font-weight: 700;
```

---

## 📏 Size Variations

| Size | Max Width | Font Size | Padding | Border Radius |
|------|-----------|-----------|---------|---------------|
| Small | 16rem | 1rem | 0.625rem 0.75rem | 0.5rem |
| Default | 22rem | 1.25rem | 0.875rem 1rem | 0.8rem |
| Large | 28rem | 1.5rem | 1.25rem 1.5rem | 1rem |

---

## 🐛 Common Issues & Solutions

### Issue: Text still overflows
**Solution:** Ensure `box-sizing: border-box` is set and check for conflicting CSS

### Issue: Words break mid-character
**Solution:** Use `word-break: normal` instead of `word-break: break-all`

### Issue: No wrapping occurs
**Solution:** Check that `white-space` is not set to `nowrap` or `pre`

### Issue: Hyphens not appearing
**Solution:** Add `lang="en"` attribute to HTML element

---

## 📦 Files Included

1. **StyledTextContainer.jsx** - React component with all modes
2. **StyledTextContainer.css** - Complete CSS with all variations
3. **text-container-examples.html** - Standalone HTML demo
4. **TailwindTextContainer.jsx** - Tailwind CSS implementations
5. **TextContainerDocumentation.md** - This documentation

---

## 🔧 Customization Guide

### Change Colors
```css
.text-box {
  background-color: YOUR_BG_COLOR;
  border-color: YOUR_BORDER_COLOR;
  color: YOUR_TEXT_COLOR;
}
```

### Adjust Dimensions
```css
.text-box {
  max-width: YOUR_MAX_WIDTH;
  padding: YOUR_PADDING;
  border-radius: YOUR_RADIUS;
}
```

### Modify Typography
```css
.text-box {
  font-family: YOUR_FONT;
  font-size: YOUR_SIZE;
  font-weight: YOUR_WEIGHT;
  line-height: YOUR_LINE_HEIGHT;
}
```

---

## ✅ Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (requires polyfills for line-clamp)

---

## 📚 Additional Resources

- [MDN: overflow-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap)
- [MDN: word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break)
- [MDN: hyphens](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)
- [CSS-Tricks: Line Clamping](https://css-tricks.com/line-clampin/)

---

## 🎓 Best Practices

1. **Always use `box-sizing: border-box`** for predictable sizing
2. **Combine `overflow-wrap` with `word-break: normal`** for best results
3. **Set appropriate `line-height`** (1.4-1.6) for readability
4. **Test with various content lengths** to ensure proper behavior
5. **Consider accessibility** - maintain sufficient color contrast
6. **Use semantic HTML** - wrap in appropriate elements (h2, p, etc.)
7. **Test on mobile devices** - ensure text remains readable

---

Made with ❤️ for perfect text containment
