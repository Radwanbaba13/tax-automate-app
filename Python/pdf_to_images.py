import sys
import json
import base64
import io
import fitz  # PyMuPDF


def pdf_to_images(pdf_base64: str, filename: str) -> list:
    try:
        pdf_bytes = base64.b64decode(pdf_base64)
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        images = []

        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]

            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)

            png_bytes = pix.tobytes("png")
            png_base64 = base64.b64encode(png_bytes).decode('utf-8')

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
    try:
        input_data = json.loads(sys.stdin.read())

        all_images = []

        for file in input_data.get('files', []):
            if file.get('type') == 'application/pdf':
                pdf_images = pdf_to_images(file['base64'], file['name'])
                all_images.extend(pdf_images)
            else:
                all_images.append(file)

        print(json.dumps({
            'success': True,
            'images': all_images
        }))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
