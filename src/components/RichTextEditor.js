import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import './RichTextEditor.css';

const EMPTY_PARAGRAPH = '<p></p>';

const RichTextEditor = ({
  element,
  isSelected,
  onContentChange,
  onFocus,
  onBlur,
  placeholder = 'Write something'
}) => {
  const [, forceUpdate] = useState(0);
  const lastSyncedContentRef = useRef(element?.text || '');

  const editor = useEditor(
    {
      extensions: [
        Color.configure({ types: [TextStyle.name] }),
        TextStyle,
        Underline,
        TextAlign.configure({
          defaultAlignment: 'left',
          types: ['heading', 'paragraph']
        }),
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          bulletList: { keepMarks: true, keepAttributes: false },
          orderedList: { keepMarks: true, keepAttributes: false }
        }),
        Placeholder.configure({
          placeholder,
          includeChildren: true
        })
      ],
      content: element?.text || EMPTY_PARAGRAPH,
      editable: Boolean(isSelected),
      editorProps: {
        attributes: {
          class: 'tiptap-editor-content',
          'data-text-editable': 'true',
          spellcheck: 'false',
          translate: 'no'
        }
      },
      onUpdate: ({ editor: activeEditor }) => {
        if (!activeEditor) {
          return;
        }
        const html = activeEditor.getHTML();
        if (html === lastSyncedContentRef.current) {
          return;
        }
        lastSyncedContentRef.current = html;
        const plainText = activeEditor.getText();
        onContentChange?.(html, plainText);
      }
    },
    [element?.id]
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleFocus = () => {
      onFocus?.();
    };
    const handleBlur = () => {
      onBlur?.();
    };
    const handleSelectionUpdate = () => {
      forceUpdate((tick) => tick + 1);
    };

    editor.on('focus', handleFocus);
    editor.on('blur', handleBlur);
    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('transaction', handleSelectionUpdate);

    return () => {
      editor.off('focus', handleFocus);
      editor.off('blur', handleBlur);
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('transaction', handleSelectionUpdate);
    };
  }, [editor, onFocus, onBlur]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(Boolean(isSelected));
    if (!isSelected) {
      editor.commands.blur();
      return;
    }
    if (!editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [editor, isSelected]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const nextContent = element?.text || EMPTY_PARAGRAPH;
    if (nextContent === lastSyncedContentRef.current) {
      return;
    }
    lastSyncedContentRef.current = nextContent;
    editor.commands.setContent(nextContent, false);
  }, [editor, element?.text, element?.id]);

  const editorStyle = useMemo(() => {
    if (!element) {
      return {};
    }

    const decorations = [];
    if (element.underline) {
      decorations.push('underline');
    }
    if (element.strikethrough) {
      decorations.push('line-through');
    }

    return {
      fontFamily: element.fontFamily || 'Inter, sans-serif',
      fontSize: element.fontSize ? `${element.fontSize}px` : '18px',
      color: element.color || '#f9fafb',
      textAlign: element.textAlign || 'left',
      fontWeight: element.fontWeight || (element.bold ? 600 : 400),
      fontStyle: element.italic ? 'italic' : 'normal',
      textDecoration: decorations.join(' ') || 'none',
      lineHeight: element.lineHeight ? String(element.lineHeight) : '1.3',
      backgroundColor: element.backgroundColor || 'transparent'
    };
  }, [element]);

  if (!element) {
    return null;
  }

  return (
    <div className={`rich-text-editor ${isSelected ? 'is-selected' : ''}`} style={editorStyle}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
