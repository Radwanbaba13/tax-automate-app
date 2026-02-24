/**
 * Clipboard utilities for rich text copy operations
 */

/**
 * Converts HTML to plain text, preserving line breaks and structure
 */
export function htmlToPlainText(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Replace <br> and block elements with newlines
  temp.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  temp.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6').forEach((el) => {
    el.prepend(document.createTextNode('\n'));
  });

  // Get text content
  let text = temp.textContent || temp.innerText || '';

  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
}

/**
 * Wraps content in basic HTML structure for email clients
 */
export function wrapInEmailHtml(content: string, subject?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${subject ? `<title>${subject}</title>` : ''}
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
  ${content}
</body>
</html>`.trim();
}

/**
 * Copies both HTML and plain text to clipboard
 * Allows pasting with formatting in rich text editors (Outlook, Gmail, etc.)
 * and as plain text in simple text fields
 */
export async function copyRichText(
  html: string,
  plainText?: string,
): Promise<boolean> {
  try {
    // Create plain text version from HTML if not provided
    const text = plainText || htmlToPlainText(html);

    // Create ClipboardItem with both HTML and plain text
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('Failed to copy rich text:', error);
    // Fallback to plain text copy
    try {
      const text = plainText || htmlToPlainText(html);
      await navigator.clipboard.writeText(text);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy also failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Checks if a string contains HTML tags
 */
export function isHtmlContent(content: string): boolean {
  return /<[^>]+>/.test(content);
}

/**
 * Converts plain text to basic HTML with paragraph tags
 */
export function plainTextToHtml(text: string): string {
  return text
    .split('\n\n')
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}
