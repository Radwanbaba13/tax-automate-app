"""
PDF to Images Converter
Converts PDF files to PNG images (one image per page)
"""

import sys
import json
import base64
import io
import fitz  # PyMuPDF


def pdf_to_images(pdf_base64: str, filename: str) -> list:
    """
    Convert a PDF file (as base64) to a list of PNG images (as base64)

    Args:
        pdf_base64: Base64 encoded PDF file
        filename: Original filename for reference

    Returns:
        List of dicts with 'name', 'type', and 'base64' keys
    """
    try:
        # Decode base64 PDF
        pdf_bytes = base64.b64decode(pdf_base64)

        # Open PDF with PyMuPDF
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        images = []

        # Convert each page to an image
        for page_num in range(len(pdf_document)):
            # Get the page
            page = pdf_document[page_num]

            # Render page to an image (2x scale for better quality)
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)

            # Convert to PNG bytes
            png_bytes = pix.tobytes("png")

            # Encode to base64
            png_base64 = base64.b64encode(png_bytes).decode('utf-8')

            # Add to results
            images.append({
                'name': f"{filename} (Page {page_num + 1})",
                'type': 'image/png',
                'base64': png_base64
            })

        pdf_document.close()
        return images

    except Exception as e:
        raise Exception(f"Error converting PDF: {str(e)}")


def main():
    """Main entry point - reads JSON from stdin, processes PDFs, outputs JSON"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        all_images = []

        # Process each file
        for file in input_data.get('files', []):
            if file.get('type') == 'application/pdf':
                # Convert PDF to images
                pdf_images = pdf_to_images(file['base64'], file['name'])
                all_images.extend(pdf_images)
            else:
                # Keep non-PDF files as-is
                all_images.append(file)

        # Output result as JSON
        print(json.dumps({
            'success': True,
            'images': all_images
        }))

    except Exception as e:
        # Output error as JSON
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
