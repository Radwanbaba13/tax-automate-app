import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import DOMPurify from 'dompurify';

interface HtmlContentViewerProps extends BoxProps {
  html: string;
}

function HtmlContentViewer({ html, ...props }: HtmlContentViewerProps) {
  // Sanitize HTML to prevent XSS attacks
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'style', 'class', 'target'],
  });

  return (
    <Box
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      sx={{
        '& p': { marginBottom: '0.5em' },
        '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.5em' },
        '& li': { marginBottom: '0.25em' },
        '& a': { color: 'blue.600', textDecoration: 'underline' },
        '& h1, & h2, & h3': { fontWeight: 'bold', marginBottom: '0.5em' },
        '& strong, & b': { fontWeight: 'bold' },
        '& em, & i': { fontStyle: 'italic' },
        '& u': { textDecoration: 'underline' },
        '& s, & strike': { textDecoration: 'line-through' },
      }}
      {...props}
    />
  );
}

export default HtmlContentViewer;
