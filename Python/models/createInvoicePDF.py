import fitz  # PyMuPDF
import datetime
import locale
import os

def create_confirmation_invoice(directory_path, selected_prices, invoice_details, tax_rate, includeTaxes, language):
    province = tax_rate["province"]
    if language == "fr":
        return create_confirmation_invoice_french(directory_path, selected_prices, invoice_details, tax_rate, includeTaxes,)
    elif language == "en":
        if province == "QC":
            return create_confirmation_invoice_bilingual(directory_path, selected_prices, invoice_details, tax_rate, includeTaxes)
        return create_confirmation_invoice_english(directory_path, selected_prices, invoice_details, tax_rate, includeTaxes)

def create_confirmation_invoice_english(directory_path, selected_prices, invoice_details, tax_rate, includeTaxes):
    # Create a new PDF document
    doc = fitz.open()

    # Initialize total amount
    total_amount = 0

    # Price management logic
    price_summary = {}
    province = tax_rate["province"]
    gst_rate = tax_rate["fedRate"]
    qst_rate = tax_rate["provRate"] if province == "QC" else 0

    # Calculate total amount first
    for price in selected_prices:
        if price['type'] == "%":
            total_amount += (total_amount * price['amount'] / 100)
        else:
            amount_total = price['amount'] * price['quantity']
            total_amount += amount_total

    # Add subtotal and tax summary
    adjusted_subtotal = total_amount
    gst = adjusted_subtotal * (gst_rate / 100) if includeTaxes else 0
    qst = adjusted_subtotal * (qst_rate / 100) if qst_rate > 0 and includeTaxes else 0

    total_with_taxes = adjusted_subtotal + gst + qst

    # Create price summary for display
    for price in selected_prices:
        key = (price['service']['en'], price['amount'], price['type'])
        price_summary[key] = {
            'quantity': price['quantity'],
            'amount': price['amount'],
            'type': price['type'],
            'service': price['service']['en']
        }

    # Set up styles
    title_style = ("Courier-Bold", 24)
    header_style = ("Helvetica-Bold", 11)
    text_style = ("Helvetica", 10)
    description_style = ("Helvetica", 8)
    dark_grey = (0.2, 0.2, 0.2)
    grey = (0.5, 0.5, 0.5)
    white = (1, 1, 1)
    red = (0.8, 0.2, 0.3)

    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    donate_path = os.path.join(script_dir, "donate.jpeg")
    logo_path = os.path.join(script_dir, "logoEN.jpeg")
    page = doc.new_page()
    page.insert_image(fitz.Rect(30, 10, 250, 166), filename=logo_path)

    # Right margin for alignment
    right_margin = 550

    # Helper function for right-aligning text using Font to calculate width
    def right_align_text(text, y, fontname, fontsize):
        font = fitz.Font(fontname)  # Create font object
        text_width = font.text_length(text, fontsize=fontsize)  # Calculate text width
        x = right_margin - text_width
        page.insert_text((x, y), text, fontname=fontname, fontsize=fontsize)

    # Add company name and details, right-aligned
    right_align_text("INVOICE", 60, title_style[0], 24)
    right_align_text("Sankari Inc.", 80, "Helvetica-Bold", 12)
    right_align_text("GST: 123456789RT0001", 95, description_style[0], 10)
    right_align_text("QST: 1234567890TQ0001", 110, description_style[0], 10)

    page.insert_text((360, 150), "www.sankari.ca", fontname=text_style[0], fontsize=9)
    page.insert_text((360, 160), "taxdeclaration@gmail.com", fontname=text_style[0], fontsize=9)

    right_align_text("(514) 802-4776", 150, text_style[0], 9)
    right_align_text("(514) 839-4776", 160, text_style[0], 9)

    # Page divider
    page.draw_line((0, 190), (600, 190), color=(0.7, 0.7, 0.7), width=1)

    # Helper function to align labels and values for invoice details
    def align_label_and_value(label, value, y, label_width=470, value_offset=10):
        value = str(value)
        if value:  # Only insert if value exists
            font = fitz.Font(header_style[0])
            label_width_calc = font.text_length(label, fontsize=header_style[1])
            label_x = label_width - label_width_calc
            page.insert_text((label_x, y), label, fontname=header_style[0], fontsize=header_style[1])
            page.insert_text((label_width + value_offset, y), value, fontname=text_style[0], fontsize=text_style[1])

    # Format invoice number to 6 digits
    formatted_invoice_number = f"{invoice_details.get('invoiceNumber', 'N/A'):06}"

    # Add invoice details (only if they exist)
    page.insert_text((10, 220), "Bill to", fontname=header_style[0], color=grey, fontsize=10)
    if invoice_details.get('fullName'):
        page.insert_text((10, 235), invoice_details['fullName'], fontname="Helvetica-Bold", fontsize=10)
    if invoice_details.get('companyName'):
        page.insert_text((10, 250), invoice_details['companyName'], fontname="Helvetica-Bold", fontsize=10)
    if invoice_details.get('address'):
        page.insert_text((10, 265), invoice_details['address'], fontname=text_style[0], fontsize=9)
    if invoice_details.get('email') or invoice_details.get('phoneNumber'):
        page.insert_text((10, 280), f"{invoice_details.get('email', 'N/A')}         {invoice_details.get('phoneNumber', 'N/A')}", fontname=text_style[0], fontsize=9)

    # Align labels and values for the invoice details on the right
    align_label_and_value("Invoice Number:", formatted_invoice_number, 220)
    align_label_and_value("Invoice Date:", datetime.date.today().strftime('%B %d, %Y'), 240)
    align_label_and_value("Amount Due (CAD):", f"${total_with_taxes:.2f}", 260)

    # Dark grey header
    header_rect = fitz.Rect(0, 280, 600, 315)
    page.draw_rect(header_rect, color=dark_grey, fill=dark_grey)
    page.insert_text((50, 300), "Items", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((300, 300), "Quantity", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((400, 300), "Price", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((500, 300), "Amount", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)

    # Add each item in selected_prices
    items_start = 330
    i = 0
    current_page = 0
    items_per_page = 15  # Maximum number of items per page
    current_y = items_start

    for i, ((service_name, amount, price_type), price_info) in enumerate(price_summary.items()):
        # Check if we need a new page
        if i > 0 and i % items_per_page == 0:
            current_page += 1
            page = doc.new_page()
            current_y = items_start
            
            # Add header to new page
            header_rect = fitz.Rect(0, 280, 600, 315)
            page.draw_rect(header_rect, color=dark_grey, fill=dark_grey)
            page.insert_text((50, 300), "Items", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((300, 300), "Quantity", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((400, 300), "Price", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((500, 300), "Amount", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)

        quantity = price_info['quantity']

        if price_type == "%":
            page.insert_text((50, current_y), service_name, fontname=text_style[0], fontsize=9)
            page.insert_text((500, current_y), f"{amount}%", fontname=text_style[0], fontsize=text_style[1])
        else:
            page.insert_text((50, current_y), service_name, fontname=text_style[0], fontsize=9)
            page.insert_text((325, current_y), str(quantity), fontname=text_style[0], fontsize=text_style[1])
            page.insert_text((400, current_y), f"${amount:.2f}", fontname=text_style[0], fontsize=text_style[1])
            amount_total = amount * quantity
            page.insert_text((500, current_y), f"${amount_total:.2f}", fontname=text_style[0], fontsize=text_style[1])
        
        current_y += 20

    # Page divider
    page.draw_line((0, current_y - 5), (600, current_y - 5), color=(0.7, 0.7, 0.7), width=1)

    # Add subtotal and tax summary
    if includeTaxes:
        # Subtotal
        page.insert_text((400, current_y + 15), "Subtotal:", fontname=text_style[0], fontsize=text_style[1])
        page.insert_text((500, current_y + 15), f"${total_amount:.2f}", fontname=text_style[0], fontsize=text_style[1])
        page.insert_text((400, current_y + 30), f"GST ({gst_rate}%):", fontname=text_style[0], fontsize=text_style[1])
        page.insert_text((500, current_y + 30), f"${gst:.2f}", fontname=text_style[0], fontsize=text_style[1])
        if qst_rate > 0:
            page.insert_text((400, current_y + 45), f"QST ({qst_rate}%):", fontname=text_style[0], fontsize=text_style[1])
            page.insert_text((500, current_y + 45), f"${qst:.2f}", fontname=text_style[0], fontsize=text_style[1])
        page.draw_line((375, current_y + 60), (550, current_y + 60), color=(0.7, 0.7, 0.7), width=1)
        page.insert_text((400, current_y + 75), "Total Due:", fontname=header_style[0], fontsize=header_style[1])
        page.insert_text((500, current_y + 75), f"${total_with_taxes:.2f}", fontname=header_style[0], fontsize=header_style[1])
    else:
        page.insert_text((400, current_y + 15), "Total Due:", fontname=header_style[0], fontsize=header_style[1])
        page.insert_text((500, current_y + 15), f"${adjusted_subtotal:.2f}", fontname=header_style[0], fontsize=header_style[1])

    # Add "Notes/Terms" section
    notes_start = current_y + 120
    page.insert_text((10, notes_start), "Notes / Terms:", fontname="Helvetica-Bold", fontsize=12, color=red)
    page.insert_text((10, notes_start + 20), f"{invoice_details.get('notes', 'N/A')}", fontname=text_style[0], fontsize=9)
    page.insert_text((10, notes_start + 35), "You can pay the fees by Interac e-transfer to taxdeclaration@gmail.com. For the password, you can use the word \"declaration\".", fontname=text_style[0], fontsize=8)

    page.insert_image(fitz.Rect(10, 750, 110, 820), filename=donate_path)
    # Insert the first line in red
    page.insert_text((100, 780), "Together, we can help!", fontname=text_style[0], fontsize=10, color=red)
    page.insert_text((100, 790), "This year, for each tax declaration we file,", fontname=text_style[0], fontsize=9)
    page.insert_text((100, 800), "$1.00 will be donated to Humanitarian Coalition.", fontname=text_style[0], fontsize=9)

    page.insert_image(fitz.Rect(350, 660, 575, 770), filename=logo_path)
    page.insert_text((360, 790), "www.sankari.ca", fontname=text_style[0], fontsize=9)
    page.insert_text((360, 800), "taxdeclaration@gmail.com", fontname=text_style[0], fontsize=9)

    right_align_text("(514) 802-4776", 790, text_style[0], 9)
    right_align_text("(514) 839-4776", 800, text_style[0], 9)

    # Save the document
    os.makedirs(directory_path, exist_ok=True)
    name = invoice_details.get('name', 'Unknown').replace(' ', '')
    date_str = datetime.date.today().strftime('%d%m%y')
    invoice_file_path = os.path.join(directory_path, f"Invoice_{name}_{date_str}.pdf")
    doc.save(invoice_file_path)
    doc.close()

    return invoice_file_path

def create_confirmation_invoice_french(directory_path, selected_prices, invoice_details, tax_rate, includeTaxes):
    # Create a new PDF document
    doc = fitz.open()

    # Initialize total amount
    total_amount = 0

    # Price management logic
    price_summary = {}
    province = tax_rate["province"]
    gst_rate = tax_rate["fedRate"]
    qst_rate = tax_rate["provRate"] if province == "QC" else 0

    # Calculate total amount first
    for price in selected_prices:
        if price['type'] == "%":
            total_amount += (total_amount * price['amount'] / 100)
        else:
            amount_total = price['amount'] * price['quantity']
            total_amount += amount_total

    # Add subtotal and tax summary
    adjusted_subtotal = total_amount
    gst = adjusted_subtotal * (gst_rate / 100) if includeTaxes else 0
    qst = adjusted_subtotal * (qst_rate / 100) if qst_rate > 0 and includeTaxes else 0

    total_with_taxes = adjusted_subtotal + gst + qst

    # Create price summary for display
    for price in selected_prices:
        key = (price['service']['fr'], price['amount'], price['type'])
        price_summary[key] = {
            'quantity': price['quantity'],
            'amount': price['amount'],
            'type': price['type'],
            'service': price['service']['fr']
        }

    # Set up styles
    title_style = ("Courier-Bold", 24)
    header_style = ("Helvetica-Bold", 11)
    text_style = ("Helvetica", 10)
    description_style = ("Helvetica", 8)
    dark_grey = (0.2, 0.2, 0.2)
    grey = (0.5, 0.5, 0.5)
    white = (1, 1, 1)
    red = (0.8, 0.2, 0.3)

    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    donate_path = os.path.join(script_dir, "donate.jpeg")
    logo_path = os.path.join(script_dir, "logoFR.jpeg")
    page = doc.new_page()
    page.insert_image(fitz.Rect(30, 10, 250, 166), filename=logo_path)

    # Right margin for alignment
    right_margin = 550

    # Helper function for right-aligning text using Font to calculate width
    def right_align_text(text, y, fontname, fontsize):
        font = fitz.Font(fontname)  # Create font object
        text_width = font.text_length(text, fontsize=fontsize)  # Calculate text width
        x = right_margin - text_width
        page.insert_text((x, y), text, fontname=fontname, fontsize=fontsize)

    # Add company name and details, right-aligned
    right_align_text("FACTURE", 60, title_style[0], 24)
    right_align_text("Sankari Inc.", 80, "Helvetica-Bold", 12)
    right_align_text("TPS: 123456789RT0001", 95, description_style[0], 10)
    right_align_text("TVQ: 1234567890TQ0001", 110, description_style[0], 10)

    page.insert_text((360, 150), "www.sankari.ca", fontname=text_style[0], fontsize=9)
    page.insert_text((360, 160), "taxdeclaration@gmail.com", fontname=text_style[0], fontsize=9)

    right_align_text("(514) 802-4776", 150, text_style[0], 9)
    right_align_text("(514) 839-4776", 160, text_style[0], 9)

    # Page divider
    page.draw_line((0, 190), (600, 190), color=(0.7, 0.7, 0.7), width=1)

    # Helper function to align labels and values for invoice details
    def align_label_and_value(label, value, y, label_width=470, value_offset=10):
        value = str(value)
        if value:
            font = fitz.Font(header_style[0])
            label_width_calc = font.text_length(label, fontsize=header_style[1])
            label_x = label_width - label_width_calc
            page.insert_text((label_x, y), label, fontname=header_style[0], fontsize=header_style[1])
            page.insert_text((label_width + value_offset, y), value, fontname=text_style[0], fontsize=text_style[1])

    # Format invoice number to 6 digits
    formatted_invoice_number = f"{invoice_details.get('invoiceNumber', 'N/A'):06}"

    # Add invoice details (only if they exist)
    page.insert_text((10, 220), "Facturé à", fontname=header_style[0], color=grey, fontsize=10)
    if invoice_details.get('fullName'):
        page.insert_text((10, 235), invoice_details['fullName'], fontname="Helvetica-Bold", fontsize=10)
    if invoice_details.get('companyName'):
        page.insert_text((10, 250), invoice_details['companyName'], fontname="Helvetica-Bold", fontsize=10)
    if invoice_details.get('address'):
        page.insert_text((10, 265), invoice_details['address'], fontname=text_style[0], fontsize=9)
    if invoice_details.get('email') or invoice_details.get('phoneNumber'):
        page.insert_text((10, 280), f"{invoice_details.get('email', 'N/A')}         {invoice_details.get('phoneNumber', 'N/A')}", fontname=text_style[0], fontsize=9)

    # Set locale to French
    locale.setlocale(locale.LC_TIME, "fr_FR.UTF-8")

    # Format date properly in French and ensure correct encoding
    formatted_date = datetime.date.today().strftime('%d %B %Y')

    # Ensure the output is correctly encoded
    formatted_date = formatted_date.encode('latin1').decode('utf-8')

    align_label_and_value("Numéro de facture :", formatted_invoice_number, 220)
    align_label_and_value("Date de facture :", formatted_date, 240)
    align_label_and_value("Montant dû (CAD):", f"{total_with_taxes:.2f}".replace('.', ',') + " $", 260)

    # Dark grey header
    header_rect = fitz.Rect(0, 280, 600, 315)
    page.draw_rect(header_rect, color=dark_grey, fill=dark_grey)
    page.insert_text((50, 300), "Articles", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((300, 300), "Quantité", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((400, 300), "Prix", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((500, 300), "Montant", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)

    # Add each item in selected_prices
    items_start = 330
    i = 0
    current_page = 0
    items_per_page = 15  # Maximum number of items per page
    current_y = items_start

    for i, ((service_name, amount, price_type), price_info) in enumerate(price_summary.items()):
        # Check if we need a new page
        if i > 0 and i % items_per_page == 0:
            current_page += 1
            page = doc.new_page()
            current_y = items_start
            
            # Add header to new page
            header_rect = fitz.Rect(0, 280, 600, 315)
            page.draw_rect(header_rect, color=dark_grey, fill=dark_grey)
            page.insert_text((50, 300), "Articles", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((300, 300), "Quantité", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((400, 300), "Prix", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((500, 300), "Montant", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)

        quantity = price_info['quantity']

        if price_type == "%":
            page.insert_text((50, current_y), service_name, fontname=text_style[0], fontsize=9)
            page.insert_text((500, current_y), f"{amount}%", fontname=text_style[0], fontsize=text_style[1])
        else:
            page.insert_text((50, current_y), service_name, fontname=text_style[0], fontsize=9)
            page.insert_text((325, current_y), str(quantity), fontname=text_style[0], fontsize=text_style[1])
            page.insert_text((400, current_y), f"{amount:.2f}".replace('.', ',') + " $", fontname=text_style[0], fontsize=text_style[1])
            amount_total = amount * quantity
            page.insert_text((500, current_y), f"{amount_total:.2f}".replace('.', ',') + " $", fontname=text_style[0], fontsize=text_style[1])
        
        current_y += 20

    # Page divider
    page.draw_line((0, current_y - 5), (600, current_y - 5), color=(0.7, 0.7, 0.7), width=1)

    # Add subtotal and tax summary
    if includeTaxes:
        # Subtotal
        page.insert_text((350, current_y + 15), "Sous-total:", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        page.insert_text((500, current_y + 15), f"{adjusted_subtotal:.2f}".replace('.', ',') + " $", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        page.insert_text((350, current_y + 30), f"TPS ({gst_rate}%):", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        page.insert_text((500, current_y + 30), f"{gst:.2f}".replace('.', ',') + " $", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        if qst_rate > 0:
            page.insert_text((350, current_y + 45), f"TVQ ({qst_rate}%):", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
            page.insert_text((500, current_y + 45), f"{qst:.2f}".replace('.', ',') + " $", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        page.draw_line((350, current_y + 60), (550, current_y + 60), color=(0.7, 0.7, 0.7), width=1)
        page.insert_text((400, current_y + 75), "Total:", fontname=header_style[0], fontsize=header_style[1], color=dark_grey)
        page.insert_text((500, current_y + 75), f"{total_with_taxes:.2f}".replace('.', ',') + " $", fontname=header_style[0], fontsize=header_style[1])
    else:
        page.insert_text((400, current_y + 15), "Total:", fontname=header_style[0], fontsize=header_style[1], color=dark_grey)
        page.insert_text((500, current_y + 15), f"{adjusted_subtotal:.2f}".replace('.', ',') + " $", fontname=header_style[0], fontsize=header_style[1])

    # Add "Notes/Terms" section
    notes_start = current_y + 120
    page.insert_text((10, notes_start), "Notes / Conditions:", fontname="Helvetica-Bold", fontsize=12, color=red)
    page.insert_text((10, notes_start + 20), f"{invoice_details.get('notes', 'N/A')}", fontname=text_style[0], fontsize=9)
    page.insert_text((10, notes_start + 35), "Vous pouvez payer les frais par virement électronique Interac à taxdeclaration@gmail.com. Pour le mot de passe, vous pouvez utiliser le mot \"declaration\".", fontname=text_style[0], fontsize=8)

    page.insert_image(fitz.Rect(10, 750, 110, 820), filename=donate_path)
    # Insert the first line in red
    page.insert_text((100, 780), "Ensemble, nous pouvons faire une difference!", fontname=text_style[0], fontsize=10, color=red)
    page.insert_text((100, 790), "Cette année, avec chaque déclaration d'impôt,", fontname=text_style[0], fontsize=9)
    page.insert_text((100, 800), "un don de 1$ sera versé à Coalition Humanitaire.", fontname=text_style[0], fontsize=9)

    page.insert_image(fitz.Rect(350, 660, 575, 770), filename=logo_path)
    page.insert_text((360, 790), "www.sankari.ca", fontname=text_style[0], fontsize=9)
    page.insert_text((360, 800), "taxdeclaration@gmail.com", fontname=text_style[0], fontsize=9)

    right_align_text("(514) 802-4776", 790, text_style[0], 9)
    right_align_text("(514) 839-4776", 800, text_style[0], 9)

    # Save the PDF file
    name = invoice_details.get('name', 'Unknown').replace(' ', '')
    date_str = datetime.date.today().strftime('%d%m%y')
    pdf_file_path = os.path.join(directory_path, f"Facture_{name}_{date_str}.pdf")
    doc.save(pdf_file_path)
    doc.close()

    return pdf_file_path

def create_confirmation_invoice_bilingual(directory_path, selected_prices, invoice_details, tax_rate, includeTaxes):
    # Create a new PDF document
    doc = fitz.open()

    # Initialize total amount
    total_amount = 0

    # Price management logic
    price_summary = {}
    province = tax_rate["province"]
    gst_rate = tax_rate["fedRate"]
    qst_rate = tax_rate["provRate"] if province == "QC" else 0

    # Determine if the invoice should be bilingual (if province is Quebec)
    is_bilingual = province == "QC"

    for price in selected_prices:
        # Create bilingual service names if in Quebec
        service_name_fr = price['service']['fr']
        service_name_en = price['service']['en']
        service_name = f"{service_name_en} / {service_name_fr}" if is_bilingual else service_name_en
        key = (service_name, price['amount'], price['type'])
        price_summary[key] = {
            'quantity': price['quantity'],
            'amount': price['amount'],
            'type': price['type'],
            'service': service_name
        }

    # Calculate total amount first
    for price in selected_prices:
        if price['type'] == "%":
            total_amount += (total_amount * price['amount'] / 100)
        else:
            amount_total = price['amount'] * price['quantity']
            total_amount += amount_total

    # Add subtotal and tax summary
    adjusted_subtotal = total_amount
    gst = adjusted_subtotal * (gst_rate / 100) if includeTaxes else 0
    qst = adjusted_subtotal * (qst_rate / 100) if qst_rate > 0 and includeTaxes else 0

    total_with_taxes = adjusted_subtotal + gst + qst

    # Set up styles
    title_style = ("Courier-Bold", 24)
    header_style = ("Helvetica-Bold", 11)
    text_style = ("Helvetica", 10)
    description_style = ("Helvetica", 8)
    dark_grey = (0.2, 0.2, 0.2)
    grey = (0.5, 0.5, 0.5)
    white = (1, 1, 1)
    red = (0.8, 0.2, 0.3)

    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    donate_path = os.path.join(script_dir, "donate.jpeg")
    logo_path = os.path.join(script_dir, "logoEN.jpeg")
    page = doc.new_page()
    page.insert_image(fitz.Rect(30, 10, 250, 166), filename=logo_path)

    # Right margin for alignment
    right_margin = 550

    # Helper function for right-aligning text using Font to calculate width
    def right_align_text(text, y, fontname, fontsize):
        font = fitz.Font(fontname)  # Create font object
        text_width = font.text_length(text, fontsize=fontsize)  # Calculate text width
        x = right_margin - text_width
        page.insert_text((x, y), text, fontname=fontname, fontsize=fontsize)

    # Add company name and details, right-aligned
    right_align_text("INVOICE / FACTURE", 60, title_style[0], 24)
    right_align_text("Sankari Inc.", 80, "Helvetica-Bold", 12)
    right_align_text("GST / TPS: 123456789RT0001", 95, description_style[0], 10)
    right_align_text("QST / TVQ: 1234567890TQ0001", 110, description_style[0], 10)

    page.insert_text((360, 150), "www.sankari.ca", fontname=text_style[0], fontsize=9)
    page.insert_text((360, 160), "taxdeclaration@gmail.com", fontname=text_style[0], fontsize=9)

    right_align_text("(514) 802-4776", 150, text_style[0], 9)
    right_align_text("(514) 839-4776", 160, text_style[0], 9)

    # Page divider
    page.draw_line((0, 190), (600, 190), color=(0.7, 0.7, 0.7), width=1)

    # Helper function to align labels and values for invoice details
    def align_label_and_value(label_en, label_fr, value, y, label_width=470, value_offset=10):
        value = str(value)
        if value:
            font = fitz.Font(header_style[0])
            label = f"{label_en} / {label_fr}"
            label_width_calc = font.text_length(label, fontsize=header_style[1])
            label_x = label_width - label_width_calc
            page.insert_text((label_x, y), label, fontname=header_style[0], fontsize=header_style[1])
            page.insert_text((label_width + value_offset, y), value, fontname=text_style[0], fontsize=text_style[1])

    # Format invoice number to 6 digits
    formatted_invoice_number = f"{invoice_details.get('invoiceNumber', 'N/A'):06}"

    # Add invoice details (only if they exist)
    page.insert_text((10, 220), "Billed to / Facturé à", fontname=header_style[0], color=grey, fontsize=10)
    if invoice_details.get('fullName'):
        page.insert_text((10, 235), invoice_details['fullName'], fontname="Helvetica-Bold", fontsize=10)
    if invoice_details.get('companyName'):
        page.insert_text((10, 250), invoice_details['companyName'], fontname="Helvetica-Bold", fontsize=10)
    if invoice_details.get('address'):
        page.insert_text((10, 265), invoice_details['address'], fontname=text_style[0], fontsize=9)
    if invoice_details.get('email') or invoice_details.get('phoneNumber'):
        page.insert_text((10, 280), f"{invoice_details.get('email', 'N/A')}         {invoice_details.get('phoneNumber', 'N/A')}", fontname=text_style[0], fontsize=9)

    # Add invoice labels for number, date, and amount due
    align_label_and_value("Invoice Number", "Numéro de facture:", formatted_invoice_number, 220)
    align_label_and_value("Invoice Date", "Date de facture:", datetime.date.today().strftime('%d %B %Y'), 240)
    align_label_and_value("Amount Due", "Montant dû (CAD):", f"${total_with_taxes:.2f}", 260)

    # Dark grey header for items
    header_rect = fitz.Rect(0, 280, 600, 315)
    page.draw_rect(header_rect, color=dark_grey, fill=dark_grey)
    page.insert_text((50, 300), "Items / Articles", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((275, 300), "Quantity / Quantité", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((400, 300), "Price / Prix", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
    page.insert_text((490, 300), "Amount / Montant", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)

    # Add each item in selected_prices
    items_start = 330
    i = 0
    current_page = 0
    items_per_page = 15  # Maximum number of items per page
    current_y = items_start

    for i, ((service_name, amount, price_type), price_info) in enumerate(price_summary.items()):
        # Check if we need a new page
        if i > 0 and i % items_per_page == 0:
            current_page += 1
            page = doc.new_page()
            current_y = items_start
            
            # Add header to new page
            header_rect = fitz.Rect(0, 280, 600, 315)
            page.draw_rect(header_rect, color=dark_grey, fill=dark_grey)
            page.insert_text((50, 300), "Items / Articles", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((275, 300), "Quantity / Quantité", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((400, 300), "Price / Prix", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)
            page.insert_text((490, 300), "Amount / Montant", fontname="Helvetica-Bold", fontsize=header_style[1], color=white)

        quantity = price_info['quantity']

        if price_type == "%":
            page.insert_text((10, current_y), service_name, fontname=text_style[0], fontsize=9)
            page.insert_text((500, current_y), f"{amount}%", fontname=text_style[0], fontsize=text_style[1])
        else:
            page.insert_text((10, current_y), service_name, fontname=text_style[0], fontsize=9)
            page.insert_text((325, current_y), str(quantity), fontname=text_style[0], fontsize=text_style[1])
            page.insert_text((425, current_y), f"${amount:.2f}", fontname=text_style[0], fontsize=text_style[1])
            amount_total = amount * quantity
            page.insert_text((500, current_y), f"${amount_total:.2f}", fontname=text_style[0], fontsize=text_style[1])
        
        current_y += 20 

    # Page divider
    page.draw_line((0, current_y - 5), (600, current_y - 5), color=(0.7, 0.7, 0.7), width=1)

    # Add subtotal and tax summary
    if includeTaxes:
        # Subtotal
        page.insert_text((350, current_y + 15), "Subtotal / Sous-total:", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        page.insert_text((500, current_y + 15), f"${total_amount:.2f}", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        page.insert_text((350, current_y + 30), f"GST / TPS ({gst_rate}%):", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        page.insert_text((500, current_y + 30), f"${gst:.2f}", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        if qst_rate > 0:
            page.insert_text((350, current_y + 45), f"QST / TVQ ({qst_rate}%):", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
            page.insert_text((500, current_y + 45), f"${qst:.2f}", fontname=text_style[0], fontsize=text_style[1], color=dark_grey)
        page.draw_line((350, current_y + 60), (550, current_y + 60), color=(0.7, 0.7, 0.7), width=1)
        page.insert_text((400, current_y + 75), "Total Due:", fontname=header_style[0], fontsize=header_style[1], color=dark_grey)
        page.insert_text((500, current_y + 75), f"${total_with_taxes:.2f}", fontname=header_style[0], fontsize=header_style[1])
    else:
        page.insert_text((400, current_y + 15), "Total Due:", fontname=header_style[0], fontsize=header_style[1], color=dark_grey)
        page.insert_text((500, current_y + 15), f"${adjusted_subtotal:.2f}", fontname=header_style[0], fontsize=header_style[1])

    # Add "Notes/Terms" section
    notes_start = current_y + 120
    page.insert_text((10, notes_start), "Notes / Conditions:", fontname="Helvetica-Bold", fontsize=12, color=red)
    page.insert_text((10, notes_start + 20), f"{invoice_details.get('notes', 'N/A')}", fontname=text_style[0], fontsize=9)
    page.insert_text((10, notes_start + 35), "You can pay the fees by Interac e-transfer to taxdeclaration@gmail.com. For the password, you can use the word \"declaration\".", fontname=text_style[0], fontsize=8)

    page.insert_image(fitz.Rect(10, 750, 110, 820), filename=donate_path)
    # Insert the first line in red
    page.insert_text((100, 780), "Together, we can help!", fontname=text_style[0], fontsize=10, color=red)
    page.insert_text((100, 790), "This year, for each tax declaration we file,", fontname=text_style[0], fontsize=9)
    page.insert_text((100, 800), "$1.00 will be donated to Humanitarian Coalition.", fontname=text_style[0], fontsize=9)

    page.insert_image(fitz.Rect(350, 660, 575, 770), filename=logo_path)
    page.insert_text((360, 790), "www.sankari.ca", fontname=text_style[0], fontsize=9)
    page.insert_text((360, 800), "taxdeclaration@gmail.com", fontname=text_style[0], fontsize=9)

    right_align_text("(514) 802-4776", 790, text_style[0], 9)
    right_align_text("(514) 839-4776", 800, text_style[0], 9)

    # Save the PDF document
    name = invoice_details.get('name', 'Unknown').replace(' ', '')
    date_str = datetime.date.today().strftime('%d%m%y')
    pdf_file_path = os.path.join(directory_path, f"Invoice_{name}_{date_str}.pdf")
    doc.save(pdf_file_path)
    doc.close()

    return pdf_file_path
