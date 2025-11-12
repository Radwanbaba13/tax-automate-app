import sys
import PyPDF2
from pathlib import Path
import json
import re

from models.createSummary import process_summaries


def extract_sin_and_name(file_path):
    file_name = Path(file_path).stem  
    
    match = re.match(r"(.+?) - (.+?)(?:_\d{4})?$", file_name)
    
    if match:
        sin = match.group(1).split("/")[-1] 
        name = match.group(2) 
        return sin, name
    else:
        raise ValueError(f"Filename format is incorrect: {file_name}")


def read_pdf(file_path):
    bookmarks = []
    first_page_lines = []
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            first_page = reader.pages[0]
            first_page_text = first_page.extract_text().splitlines()
            first_page_lines = first_page_text[:2]

            def extract_bookmarks(outlines, parent_title=""):
                for item in outlines:
                    if isinstance(item, list):
                        extract_bookmarks(item, parent_title)
                    else:
                        title = item.title
                        page_num = reader.get_destination_page_number(item)
                        bookmarks.append(f"{parent_title} > {title} (Page {page_num + 1})")

            extract_bookmarks(reader.outline)
    except Exception as e:
        bookmarks = [f"Error reading PDF: {e}"]
    return bookmarks, first_page_lines

def determine_language(bookmarks):
    for bookmark in bookmarks:
        if "Executive summary".lower() in bookmark.lower():
            return "EN"
        elif "Sommaire principal".lower() in bookmark.lower():
            return "FR"
    raise ValueError("Neither 'Executive Summary' nor 'Sommaire principal' found in the bookmarks.")

def extract_year(first_page_lines, language):
    year_line = first_page_lines[1] if len(first_page_lines) > 1 else ""
    if language == "EN" and "for" in year_line.lower() and "taxation year" in year_line.lower():
        # Extract the second-to-last item in the string, which is the year
        year = year_line.split()[-3]
    elif language == "FR" and "pour l'année d'imposition" in year_line.lower():
        # Extract the last item in the string, which is the year
        year = year_line.split()[-1]
    else:
        raise ValueError("Could not determine the year from the PDF.")
    return year

def create_documents(file_data, directory_path, configuration):
    from PyPDF2 import PdfWriter, PdfReader

    file_path = file_data["directory"]

    def protect_pdf(pdf_writer, password):
        pdf_writer.encrypt(user_pwd=password, owner_pwd=password)

    def save_document(pdf_writer, output_path):
        with open(output_path, "wb") as f:
            pdf_writer.write(f)

    sin, name = extract_sin_and_name(file_path)
    pdf_reader = PdfReader(file_path)
    bookmarks, first_page_lines = read_pdf(file_path)
    language = determine_language(bookmarks)
    year = extract_year(first_page_lines, language)

    # Assign year and language to client file data
    file_data['year'] = year
    file_data['language'] = language

    def get_config_for_language(section_key, language):
        return configuration.get(section_key, {}).get(language.lower(), [])

    fed_auth_section = get_config_for_language('fedAuthSection', language.lower())
    qc_auth_section = get_config_for_language('qcAuthSection', language.lower())
    summary_section = get_config_for_language('summarySection', language.lower())

    summary_pages, fed_authorization_pages, qc_authorization_pages = [], [], []

    def get_pages_for_section(section, section_pages):
        for bookmark in bookmarks:
            for entry in section:
                if entry.lower() in bookmark.lower() and not ("with spouse" in bookmark.lower()):
                    page_num = int(bookmark.split("Page ")[1].split(")")[0]) - 1
                    section_pages.append(page_num)

    get_pages_for_section(summary_section, summary_pages)
    get_pages_for_section(fed_auth_section, fed_authorization_pages)
    get_pages_for_section(qc_auth_section, qc_authorization_pages)

    base_path = Path(directory_path)
    name_dir = base_path
    name_dir.mkdir(parents=True, exist_ok=True)

    sin_file_path = name_dir / f"{sin}.txt"
    with open(sin_file_path, "w") as f:
        pass

    if language == "FR":
        copy_file_name = f"COPIE de la Déclaration d'Impôt {year} - {name}.pdf"
        fed_auth_file_name = f"FED Autorisation {year} - {name}.pdf"
        qc_auth_file_name = f"QC Autorisation {year} - {name}.pdf"
        summary_file_name = f"Sommaire {year} - {name}.pdf"
    else:
        copy_file_name = f"COPY of {year} Tax Return - {name}.pdf"
        fed_auth_file_name = f"FED Authorization {year} - {name}.pdf"
        qc_auth_file_name = f"QC Authorization {year} - {name}.pdf"
        summary_file_name = f"Summary {year} - {name}.pdf"

    copy_of_td_writer = PdfWriter()
    protect_pdf(copy_of_td_writer, sin)
    for page_num in range(len(pdf_reader.pages)):
        copy_of_td_writer.add_page(pdf_reader.pages[page_num])
    save_document(copy_of_td_writer, name_dir / copy_file_name)

    if fed_authorization_pages:
        fed_auth_writer = PdfWriter()
        for page_num in fed_authorization_pages:
            fed_auth_writer.add_page(pdf_reader.pages[page_num])
        save_document(fed_auth_writer, name_dir / fed_auth_file_name)

    if qc_authorization_pages:
        qc_auth_writer = PdfWriter()
        for page_num in qc_authorization_pages:
            qc_auth_writer.add_page(pdf_reader.pages[page_num])
        save_document(qc_auth_writer, name_dir / qc_auth_file_name)

    summary_file_path = name_dir / summary_file_name if summary_pages else None
    if summary_pages:
        summary_writer = PdfWriter()
        for page_num in summary_pages:
            summary_writer.add_page(pdf_reader.pages[page_num])
        save_document(summary_writer, summary_file_path)

    # Append the summary file path to the client file data
    file_data['summary_file_path'] = str(summary_file_path) if summary_file_path else None

    return {
        'year': int(year),
        'summary_file_path': str(summary_file_path) if summary_file_path else None,
        'result': 'Documents created successfully',
    }

def process_files(client_files, directory_path, configuration):
    for client_file in client_files:
        response = create_documents(client_file, directory_path, configuration)
        client_file['year'] = response['year']
    process_summaries(client_files, directory_path) 
    return

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        client_files = json.loads(sys.argv[1])
        directory_path = sys.argv[2]
        try:
            configuration = json.loads(sys.argv[3])
        except json.JSONDecodeError as e:
            print(json.dumps({'error': f"Error parsing configuration JSON: {e}"}))

        process_files(client_files, directory_path, configuration)
        print(json.dumps({'result': 'Documents created successfully.'}))
    else:
        print(json.dumps({'error': 'Insufficient arguments provided.'}))
