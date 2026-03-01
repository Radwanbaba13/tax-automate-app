import React, { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import { Box } from '@chakra-ui/react';
import 'react-quill/dist/quill.snow.css';

// Register custom fonts in Quill's whitelist
const Font = Quill.import('formats/font') as any;
Font.whitelist = ['arial', 'sans-serif', 'times-new-roman', 'courier-new'];
Quill.register(Font, true);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
}

function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter content...',
  minHeight = '200px',
  readOnly = false,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: readOnly
        ? false
        : [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ font: ['arial', 'sans-serif', 'times-new-roman', 'courier-new'] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link'],
            ['clean'],
          ],
    }),
    [readOnly],
  );

  const formats = [
    'header',
    'font',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align',
    'link',
  ];

  return (
    <Box
      sx={{
        '.ql-toolbar': {
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          backgroundColor: '#f7fafc',
          borderColor: '#e2e8f0',
        },
        '.ql-container': {
          minHeight,
          fontSize: '10pt',
          fontFamily: 'Arial, sans-serif',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          borderColor: '#e2e8f0',
        },
        '.ql-editor': {
          minHeight,
          fontFamily: 'Arial, sans-serif',
          fontSize: '10pt',
        },
        '.ql-editor.ql-blank::before': {
          color: '#a0aec0',
          fontStyle: 'normal',
        },
        // Font family definitions for Quill classes
        '.ql-font-arial': { fontFamily: 'Arial, sans-serif' },
        '.ql-font-times-new-roman': { fontFamily: "'Times New Roman', serif" },
        '.ql-font-courier-new': { fontFamily: "'Courier New', monospace" },
        '.ql-font-sans-serif': { fontFamily: 'sans-serif' },
        // Toolbar: default (no font) label shows "Arial"
        '.ql-font .ql-picker-label::before': { content: '"Arial"' },
        '.ql-font .ql-picker-item::before': { content: '"Arial"' },
        // Toolbar: named font labels
        '.ql-font .ql-picker-label[data-value="arial"]::before': {
          content: '"Arial"',
        },
        '.ql-font .ql-picker-item[data-value="arial"]::before': {
          content: '"Arial"',
          fontFamily: 'Arial, sans-serif',
        },
        '.ql-font .ql-picker-label[data-value="sans-serif"]::before': {
          content: '"Sans Serif"',
        },
        '.ql-font .ql-picker-item[data-value="sans-serif"]::before': {
          content: '"Sans Serif"',
          fontFamily: 'sans-serif',
        },
        '.ql-font .ql-picker-label[data-value="times-new-roman"]::before': {
          content: '"Times New Roman"',
        },
        '.ql-font .ql-picker-item[data-value="times-new-roman"]::before': {
          content: '"Times New Roman"',
          fontFamily: "'Times New Roman', serif",
        },
        '.ql-font .ql-picker-label[data-value="courier-new"]::before': {
          content: '"Courier New"',
        },
        '.ql-font .ql-picker-item[data-value="courier-new"]::before': {
          content: '"Courier New"',
          fontFamily: "'Courier New', monospace",
        },
      }}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        readOnly={readOnly}
      />
    </Box>
  );
}

export default RichTextEditor;
