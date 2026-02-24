import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import { Box } from '@chakra-ui/react';
import 'react-quill/dist/quill.snow.css';

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
            [{ font: [] }],
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
          fontSize: '14px',
          fontFamily: 'inherit',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          borderColor: '#e2e8f0',
        },
        '.ql-editor': {
          minHeight,
        },
        '.ql-editor.ql-blank::before': {
          color: '#a0aec0',
          fontStyle: 'normal',
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
