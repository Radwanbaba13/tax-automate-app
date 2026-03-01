from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import locale
import time


def createIndividualWordDoc(individual, output_file_path):
    if individual['language'] == 'EN':
        createIndividualWordDocEN(individual, output_file_path)
    if individual['language'] == 'FR':
        createIndividualWordDocFR(individual, output_file_path)

def createCoupleWordDoc(couple_summaries, output_file_path):
    primary_client = next((c for c in couple_summaries if c['isPrimary']), None)
    language = primary_client['language']
    if language == 'EN':
        createCoupleWordDocEN(couple_summaries, output_file_path)
    elif language == 'FR':
        createCoupleWordDocFR(couple_summaries, output_file_path)


try:
    locale.setlocale(locale.LC_ALL, 'fr_CA.UTF-8')
except locale.Error:
    try:
        locale.setlocale(locale.LC_ALL, 'French_Canada.1252')  # Windows
    except locale.Error:
        pass

def format_currency(amount):
    # Convert the amount to a float and format it as a string
    return f"{locale.format_string('%.2f', amount, grouping=True).replace('.', ',')} $"

# Function to set default font and size for the entire document
def set_default_font(doc, font_name, font_size):
    styles = doc.styles['Normal']
    font = styles.font
    font.name = font_name
    font.size = Pt(font_size)

# Function that adds a hyperlink to a paragraph.
def add_hyperlink(paragraph, text, url):
    # Create the w:hyperlink tag and add required attributes
    part = paragraph.part
    r_id = part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)

    # Create a w:r element
    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    color = OxmlElement('w:color')
    color.set(qn('w:val'), '0000FF')
    rPr.append(color)
    underline = OxmlElement('w:u')
    underline.set(qn('w:val'), 'single')
    rPr.append(underline)
    italic = OxmlElement('w:i')
    rPr.append(italic)
    # Apply properties to the run
    new_run.append(rPr)
    new_run.text = text
    hyperlink.append(new_run)
    # Add the hyperlink to the paragraph
    paragraph._p.append(hyperlink)

# Function to create a new document and set global styles
def createIndividualWordDocEN(individual, output_file_path):
    return_summary = individual['summary']
    year = individual['year']
    ind_title = individual['title']
    isMailQC = individual['isMailQC']
    isNewcomer = individual['isNewcomer']
    doc = Document()

    # Set default font to Calibri and size 10pt for the entire document
    set_default_font(doc, "Calibri", 10)

    # Check for each section and call the respective function only if the section exists
    section_1(doc, return_summary, ind_title, year, isMailQC)
    tax_return(doc, return_summary, year)

    if "gst_amounts" in return_summary and return_summary["gst_amounts"]:
        gst_credit(doc, return_summary, isNewcomer, year)

    if "ecgeb_amounts" in return_summary and return_summary["ecgeb_amounts"]:
        ecgeb_credit(doc, return_summary, isNewcomer, year)

    if "solidarity_amounts" in return_summary and return_summary["solidarity_amounts"]:
        solidarity_credit(doc, return_summary, year)

    if "carbon_rebate_amounts" in return_summary and return_summary["carbon_rebate_amounts"]:
        carbon_rebate(doc, return_summary,  year)

    if "climate_action_credit_amounts" in return_summary and return_summary["climate_action_credit_amounts"]:
        climate_action_credit(doc, return_summary, year)

    if "ontario_trillium_amounts" in return_summary and return_summary["ontario_trillium_amounts"]:
        ontario_trillium_benefit(doc, return_summary["ontario_trillium_amounts"], year)

    if "ccb_amounts" in return_summary and return_summary["ccb_amounts"]:
        child_benefit(doc, return_summary, year)

    if "family_allowance_amounts" in return_summary and return_summary["family_allowance_amounts"]:
        quebec_family_allowance(doc, return_summary, year)

    if "carryforward_amounts" in return_summary and return_summary["carryforward_amounts"]:
        carryforward_amounts(doc, return_summary)


    conclusion(doc, isMailQC)

    # Save the document in the specified path
    doc.save(output_file_path)

def createCoupleWordDocEN(couple_summaries, output_file_path):
    doc = Document()

    # Set default font to Calibri and size 10pt for the entire document
    set_default_font(doc, "Calibri", 10)

    # Initialize variables to track the year, isMailQC, and isNewcomer
    year = couple_summaries[0]['year']
    isMailQC = False
    isNewcomer = False

    for individual in couple_summaries:
        if individual['isMailQC']:
            isMailQC = True
        if individual['isNewcomer']:
            isNewcomer = True

    # Process the primary individual
    primary_individual = next(individual for individual in couple_summaries if individual['isPrimary'])
    secondary_individual = next(individual for individual in couple_summaries if not individual['isPrimary'])

    section_1(doc, primary_individual['summary'], primary_individual['title'], year, isMailQC, couple=True, secondary_summary=secondary_individual['summary'], secondary_ind_title=secondary_individual['title'])
    tax_return(doc, primary_individual['summary'], year,  secondary_individual['summary'], primary_individual['title'], secondary_individual['title'], isCouple=True)

    for individual in couple_summaries:
        return_summary = individual['summary']
        if "gst_amounts" in return_summary and return_summary["gst_amounts"]:
            gst_credit(doc, return_summary, isNewcomer, year)

        if "ecgeb_amounts" in return_summary and return_summary["ecgeb_amounts"]:
            ecgeb_credit(doc, return_summary, isNewcomer, year)

        if "carbon_rebate_amounts" in return_summary and return_summary["carbon_rebate_amounts"]:
            carbon_rebate(doc, return_summary,  year)

        if "ontario_trillium_amounts" in return_summary and return_summary["ontario_trillium_amounts"]:
            ontario_trillium_benefit(doc, return_summary["ontario_trillium_amounts"], year)

        if "climate_action_credit_amounts" in return_summary and return_summary["climate_action_credit_amounts"]:
            climate_action_credit(doc, return_summary, year)

        if "solidarity_amounts" in return_summary and return_summary["solidarity_amounts"]:
            solidarity_credit(doc, return_summary, year)

        if "ccb_amounts" in return_summary and return_summary["ccb_amounts"]:
            child_benefit(doc, return_summary, year)

        if "family_allowance_amounts" in return_summary and return_summary["family_allowance_amounts"]:
            quebec_family_allowance(doc, return_summary, year)


    conclusion(doc)

    # Save the document in the specified path
    doc.save(output_file_path)

# Section 1: Title and Header
def section_1(doc, primary_summary, ind_title, year, isMailQC, couple=False, secondary_summary=None, secondary_ind_title=None):
   # Title: Centered, Dark Gray, 14pt, Calibri
    title_text = f"Summary of your {year} Tax {'Declarations' if couple else 'Declaration'}"
    title = doc.add_paragraph(title_text)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.runs[0]
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(65, 65, 65)

    # Recipient Name for Primary Individual
    para = doc.add_paragraph()
    primary_first_name = primary_summary["tax_summary"]["first_name"]
    primary_last_name = primary_summary["tax_summary"]["last_name"]
    province = primary_summary["tax_summary"]["province"]
    para.add_run(f"{ind_title}. {primary_last_name}")

    # Display Secondary Individual's name if applicable
    if couple and secondary_summary and secondary_ind_title:
        secondary_first_name = secondary_summary["tax_summary"]["first_name"]
        secondary_last_name = secondary_summary["tax_summary"]["last_name"]
        para.add_run(f" & {secondary_ind_title}. {secondary_last_name}")

    # Introduction paragraph
    para = doc.add_paragraph()
    para.add_run(f'We have attached all the documents related to your {year} tax {"declarations" if couple else "declaration"}.\n')
    para.add_run('The password consists of the nine digits of your Social Insurance Number.\n').bold = True
    para.add_run(f'The document named COPY is a copy of your complete tax return. ').bold = False
    para.add_run('You do not need to print it or sign it; ').bold = True
    para.add_run('please keep it for your records and review it carefully to ensure everything is accurate and complete.').bold = False

    # "Very Important" without extra paragraph spacing
    very_important_run = para.add_run('\n\n** Very Important:\n')
    very_important_run.bold = True
    very_important_run.underline = True
    very_important_run.font.color.rgb = RGBColor(205, 52, 78)
    
    # Only include Québec-specific instructions if the province is Québec
    if province == "Quebec":
        if isMailQC:
            # Special message if isMailQC is True
            federal_title_run = para.add_run('Regarding your Federal tax return:\n')
            federal_title_run.bold = True
            federal_title_run.underline = True
            para.add_run('Please be advised that your Federal tax return ')
            federal_advisory_run = para.add_run('has not been submitted ')
            federal_advisory_run.bold = True
            federal_advisory_run.underline = True
            para.add_run('to the government yet.\n').bold = True

            para.add_run(f'Attached {"are two Authorization Forms" if couple else "is an Authorization Form"}. Please e-sign it (or print & sign) and e-mail it back to us as soon as possible so we can EFILE your return.\n')
            para.add_run('Please sign Part F.\n\n')

            # Québec tax return
            quebec_title_run = para.add_run('Regarding your Québec tax return:\n')
            quebec_title_run.bold = True
            quebec_title_run.underline = True

            para.add_run('Please note that your Québec tax return cannot be transmitted via Efile.\n')
            if couple and secondary_summary:
                para.add_run(f'For that reason, you need to print the document “QC {year} - {primary_first_name} {primary_last_name}.pdf” and “QC {year} - {secondary_first_name} {secondary_last_name}.pdf”, sign at the bottom of page ##, and mail it to the following address:\n')
            else:
                para.add_run(f'For that reason, you need to print the document “QC {year} - {primary_first_name} {primary_last_name}.pdf”, sign at the bottom of page ##, and mail it to the following address:\n')

            # Address in italics
            address = para.add_run('Revenu Québec\nC. P. 2500, succursale Place-Desjardins\nMontréal (Québec) H5B 1A3\n\n')
            address.italic = True

            para.add_run('*If you would like us to mail the declaration on your behalf, please email us the signed declaration (e-signature that looks like your signature), and we will print and mail it by registered mail (with a tracking number) to QC Revenue. Please note that there will be an additional service fee of $25 plus Canada Post fees.\n')
        else:
            # Original message if isMailQC is False
            para.add_run('Please be advised that your tax returns ').bold = True
            bold_underline_run = para.add_run('have not been submitted ')
            bold_underline_run.bold = True
            bold_underline_run.underline = True
            para.add_run('to the government yet. \n').bold = True
            para.add_run(f'Attached are {"four" if couple else "two"} Authorization Forms. Please e-sign them (or print & sign) and e-mail them back to us as soon as possible so we can EFILE your returns.\n')
            para.add_run('For the Federal Form, please sign ').italic = True
            bold_part_f = para.add_run('Part F.')
            bold_part_f.bold = True
            bold_part_f.italic = True
            para.add_run('\nFor the Quebec Form, please sign at the end of ').italic = True
            bold_section_4 = para.add_run('section 4.')
            bold_section_4.bold = True
            bold_section_4.italic = True
    else:
        # Non-Québec clients (no Québec-related details)
        para.add_run('Please be advised that your tax return ').bold = True
        bold_underline_run = para.add_run('has not been submitted ')
        bold_underline_run.bold = True
        bold_underline_run.underline = True
        para.add_run('to the government yet. \n').bold = True
        para.add_run(f'Attached {"are two Authorization Forms" if couple else "is an Authorization Form"}. Please e-sign it (or print & sign) and e-mail it back to us as soon as possible so we can EFILE your return.\n')
        para.add_run('Please sign').italic = True
        bold_part_f = para.add_run(' Part F.\n')
        bold_part_f.bold = True
        bold_part_f.italic = True


def tax_return(doc, return_summary, year, secondary_summary=None, primary_title=None, secondary_title=None, isCouple=False):
    province = return_summary["tax_summary"]["province"]
    
    # Create the section for tax return results
    para = doc.add_paragraph()
    bold_red_results = para.add_run('RESULTS\n')
    bold_red_results.bold = True
    bold_red_results.font.color.rgb = RGBColor(205, 52, 78)

    # Process primary individual's tax details
    if isCouple:
        para.add_run(f"\n{primary_title}. {return_summary['tax_summary']['last_name']}\n")

    # Federal Tax Return for primary individual
    para.add_run('Federal Tax return\n').bold = True
    federal_refund = return_summary["tax_summary"]["federal_refund"]
    federal_owing = return_summary["tax_summary"]["federal_owing"]

    if federal_refund > 2:
        para.add_run(f"You are entitled to a refund of ").bold = False
        refund_run = para.add_run(f"${federal_refund:,.2f} \n")
        refund_run.bold = True
        refund_run.font.color.rgb = RGBColor(0, 128, 0)
    elif federal_owing > 2:
        para.add_run(f"You owe the amount of ").bold = False
        owing_run = para.add_run(f"${federal_owing:,.2f} \n")
        owing_run.bold = True
        owing_run.font.color.rgb = RGBColor(255, 0, 0)
    else:
        para.add_run("You have no Refund or Balance due.\n")

    # Quebec Tax Return for primary individual (only if province is Quebec)
    if province == "Quebec":
        para.add_run('Quebec Tax return\n').bold = True
        quebec_refund = return_summary["tax_summary"]["quebec_refund"]
        quebec_owing = return_summary["tax_summary"]["quebec_owing"]

        if quebec_refund > 2:
            para.add_run(f"You are entitled to a refund of ").bold = False
            refund_run = para.add_run(f"${quebec_refund:,.2f}\n")
            refund_run.bold = True
            refund_run.font.color.rgb = RGBColor(0, 128, 0)
        elif quebec_owing > 2:
            para.add_run(f"You owe the amount of ").bold = False
            owing_run = para.add_run(f"${quebec_owing:,.2f}\n")
            owing_run.bold = True
            owing_run.font.color.rgb = RGBColor(255, 0, 0)
        else:
            para.add_run("You have no Refund or Balance due.\n")

    # Add payment section for primary individual
    quebec_owing = locals().get('quebec_owing', 0)

    if federal_owing > 2 or quebec_owing > 2:
        para = doc.add_paragraph()
        para.add_run('You owe an amount on your ').italic = True

        if federal_owing > 2 and quebec_owing > 2:
            para.add_run('Federal and Quebec returns; ').italic = True
        elif federal_owing > 2:
            para.add_run('Federal return; ').italic = True
        elif quebec_owing > 2:
            para.add_run('Quebec return; ').italic = True

        para.add_run(f'please make sure to pay the balance due by April 30, {int(year) + 1}, to avoid paying any interest. ').italic = True
        para.add_run('Please wait a few days after we E-file to pay your outstanding balance. For more details on how to pay the amount due, please click on: ').italic = True

        # Add links for payment based on owing status
        if federal_owing > 2:
            add_hyperlink(para, 'Federal', 'https://www.canada.ca/en/revenue-agency/services/payments/payments-cra.html')

        if federal_owing > 2 and quebec_owing > 2:
            para.add_run(' and ')
        if quebec_owing > 2:
            add_hyperlink(para, 'Quebec', 'https://www.revenuquebec.ca/en/citizens/income-tax-return/paying-a-balance-due-or-receiving-a-refund/income-tax-balance-due/')
        para.add_run('\n')

    if isCouple and "carryforward_amounts" in return_summary and return_summary["carryforward_amounts"]:
            para = doc.add_paragraph()
            title_run = para.add_run('Your accumulated tuition fees carried forward to future years:\n')
            title_run.bold = True

            federal_tuition_amount = return_summary["carryforward_amounts"]["federal_tuition_amount"]
            quebec_tuition_8_percent = return_summary["carryforward_amounts"]["quebec_tuition_8_percent"]

            # Convert string values safely (removing commas for conversion)
            if isinstance(federal_tuition_amount, str):
                if federal_tuition_amount.strip():
                    federal_tuition_amount = int(federal_tuition_amount.replace(",", ""))
                else:
                    federal_tuition_amount = 0
            if isinstance(quebec_tuition_8_percent, str):
                if quebec_tuition_8_percent.strip():
                    quebec_tuition_8_percent = int(quebec_tuition_8_percent.replace(",", ""))
                else:
                    quebec_tuition_8_percent = 0

            # Format numbers with commas as thousand separators when adding them to the document
            if federal_tuition_amount > 0:
                para.add_run('Federal (eligible to 15%):  $')
                para.add_run(f"{federal_tuition_amount:,}")
            if 'quebec_tuition_8_percent' in locals() and quebec_tuition_8_percent is not None and quebec_tuition_8_percent > 0:
                para.add_run('\nQC (eligible to 8%): $')
                para.add_run(f"{quebec_tuition_8_percent:,}")

            para.add_run(
                '\n\nThose accumulated tuition fees are tax credits that you will be using in future tax declarations when you work '
                'and pay tax on your income.'
            ).italic = True

    # Add secondary individual if isCouple is True and secondary_summary is provided
    if isCouple and secondary_summary:
        para.add_run(f"\n{secondary_title}. {secondary_summary['tax_summary']['last_name']}\n")

        # Federal Tax Return for secondary individual
        para.add_run('Federal Tax return\n').bold = True
        federal_refund = secondary_summary["tax_summary"]["federal_refund"]
        federal_owing = secondary_summary["tax_summary"]["federal_owing"]

        if federal_refund > 2:
            para.add_run(f"You are entitled to a refund of ").bold = False
            refund_run = para.add_run(f"${federal_refund:,.2f}\n")
            refund_run.bold = True
            refund_run.font.color.rgb = RGBColor(0, 128, 0)
        elif federal_owing > 2:
            para.add_run(f"You owe the amount of ").bold = False
            owing_run = para.add_run(f"${federal_owing:,.2f}\n")
            owing_run.bold = True
            owing_run.font.color.rgb = RGBColor(255, 0, 0)
        else:
            para.add_run("You have no Refund or Balance due.\n")

        # Quebec Tax Return for secondary individual (only if province is Quebec)
        if province == "Quebec":
            para.add_run('Quebec Tax return\n').bold = True
            quebec_refund = secondary_summary["tax_summary"]["quebec_refund"]
            quebec_owing = secondary_summary["tax_summary"]["quebec_owing"]

            if quebec_refund > 2:
                para.add_run(f"You are entitled to a refund of ").bold = False
                refund_run = para.add_run(f"${quebec_refund:,.2f}")
                refund_run.bold = True
                refund_run.font.color.rgb = RGBColor(0, 128, 0)
            elif quebec_owing > 2:
                para.add_run(f"You owe the amount of ").bold = False
                owing_run = para.add_run(f"${quebec_owing:,.2f}")
                owing_run.bold = True
                owing_run.font.color.rgb = RGBColor(255, 0, 0)
            else:
                para.add_run("You have no Refund or Balance due.\n")

        # Add payment section for secondary individual
        quebec_owing = locals().get('quebec_owing', 0)
        if federal_owing > 2 or quebec_owing > 2:   

            para = doc.add_paragraph()
            para.add_run('You owe an amount on your ').italic = True

            if federal_owing > 2 and quebec_owing > 2:
                para.add_run('Federal and Quebec returns; ').italic = True
            elif federal_owing > 2:
                para.add_run('Federal return; ').italic = True
            elif quebec_owing > 2:
                para.add_run('Quebec return; ').italic = True

            para.add_run(f'please make sure to pay the balance due by April 30, {int(year) + 1}, to avoid paying any interest. ').italic = True
            para.add_run('Please wait a few days after we E-file to pay your outstanding balance. For more details on how to pay the amount due, please click on: ').italic = True

            # Add links for payment based on owing status
            if federal_owing > 2:
                add_hyperlink(para, 'Federal', 'https://www.canada.ca/en/revenue-agency/services/payments/payments-cra.html')

            if federal_owing > 2 and quebec_owing > 2:
                para.add_run(' and ')
            if quebec_owing > 2:
                add_hyperlink(para, 'Quebec', 'https://www.revenuquebec.ca/en/citizens/income-tax-return/paying-a-balance-due-or-receiving-a-refund/income-tax-balance-due/')
            para.add_run('\n')

        if "carryforward_amounts" in secondary_summary and secondary_summary["carryforward_amounts"]:
            para = doc.add_paragraph()
            title_run = para.add_run('Your accumulated tuition fees carried forward to future years:\n')
            title_run.bold = True

            federal_tuition_amount = secondary_summary["carryforward_amounts"]["federal_tuition_amount"]
            quebec_tuition_8_percent = secondary_summary["carryforward_amounts"]["quebec_tuition_8_percent"]

            # Convert string values safely (removing commas for conversion)
            if isinstance(federal_tuition_amount, str):
                if federal_tuition_amount.strip():
                    federal_tuition_amount = int(federal_tuition_amount.replace(",", ""))
                else:
                    federal_tuition_amount = 0
            if isinstance(quebec_tuition_8_percent, str):
                if quebec_tuition_8_percent.strip():
                    quebec_tuition_8_percent = int(quebec_tuition_8_percent.replace(",", ""))
                else:
                    quebec_tuition_8_percent = 0

            # Format numbers with commas as thousand separators when adding them to the document
            if federal_tuition_amount > 0:
                para.add_run('Federal (eligible to 15%):  $')
                para.add_run(f"{federal_tuition_amount:,}")
            if 'quebec_tuition_8_percent' in locals() and quebec_tuition_8_percent is not None and quebec_tuition_8_percent > 0:
                para.add_run('\nQC (eligible to 8%): $')
                para.add_run(f"{quebec_tuition_8_percent:,}")

            para.add_run(
                '\n\nThose accumulated tuition fees are tax credits that you will be using in future tax declarations when you work '
                'and pay tax on your income.'
            ).italic = True


# Section: Solidarity Credit
def solidarity_credit(doc, return_summary, year):
    para = doc.add_paragraph()
    # Add title directly with bold and underline
    title_run = para.add_run('Solidarity Credits\n')
    title_run.bold = True
    title_run.underline = True

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    solidarity_amount = return_summary["solidarity_amounts"]["solidarity_credit_amount"]

    para.add_run(f'You will receive a total of ').bold = False
    total_run = para.add_run(f"${solidarity_amount:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' for the ')
    para.add_run(f'Solidarity tax credit ').bold = True
    para.add_run(f'as follows:\n')

    # Extract amounts for each month
    amounts = {
        "July": return_summary["solidarity_amounts"]["july_amount"],
        "August": return_summary["solidarity_amounts"]["august_amount"],
        "September": return_summary["solidarity_amounts"]["september_amount"],
        "October": return_summary["solidarity_amounts"]["october_amount"],
        "November": return_summary["solidarity_amounts"]["november_amount"],
        "December": return_summary["solidarity_amounts"]["december_amount"],
        "January": return_summary["solidarity_amounts"]["january_amount"],
        "February": return_summary["solidarity_amounts"]["february_amount"],
        "March": return_summary["solidarity_amounts"]["march_amount"],
        "April": return_summary["solidarity_amounts"]["april_amount"],
        "May": return_summary["solidarity_amounts"]["may_amount"],
        "June": return_summary["solidarity_amounts"]["june_amount"],
    }

    # Filter out months with a zero amount
    filtered_months = {month: amount for month, amount in amounts.items() if amount > 0}

    if len(filtered_months) <= 4:
        for month, amount in filtered_months.items():
            year = year_plus1 if month in ["July", "August", "September", "October", "November", "December"] else year_plus2
            para.add_run(f'{month} {year}: ${amount:,.2f}\n')
    else:
        # Check for consistency of amounts for the range
        unique_amounts = set(filtered_months.values())

        if len(unique_amounts) == 1:
            # If all amounts are the same
            amount = next(iter(unique_amounts))  # Get the single value
            para.add_run(f'${amount:,.2f}/month from July {year_plus1} to June {year_plus2}\n')
        else:
            # Group amounts by ranges
            amount_ranges = []
            current_amount = None
            start_month = None

            for month, amount in filtered_months.items():
                year = year_plus1 if month in ["July", "August", "September", "October", "November", "December"] else year_plus2

                if current_amount is None:
                    current_amount = amount
                    start_month = month
                elif abs(current_amount - amount) > 0.3:  # Different enough to create a new range
                    end_year = year_plus1 if start_month in ["July", "August", "September", "October", "November", "December"] else year_plus2
                    amount_ranges.append((start_month, month, current_amount, end_year))
                    current_amount = amount
                    start_month = month
                # Handle the last range
                if month == "June":
                    end_year = year_plus2 
                    amount_ranges.append((start_month, month, current_amount, end_year))

            for start, end, amount, end_year in amount_ranges:
                para.add_run(f'${amount:,.2f}/month from {start} {year_plus1} to {end} {end_year}\n')

# Section: GST Credit
def gst_credit(doc, return_summary, isNewcomer, year):
    para = doc.add_paragraph()
    title_run = para.add_run('GST ')
    title_run.bold = True
    title_run.underline = True
    if isNewcomer:
      title_run = para.add_run('* ')
      title_run.bold = True
      title_run.underline = True
    title_run = para.add_run('Credits:\n')

    title_run.bold = True
    title_run.underline = True

    gst_credit_amount = return_summary["gst_amounts"]["gst_credit_amount"]
    july_amount = return_summary["gst_amounts"].get("july_amount", 0)
    october_amount = return_summary["gst_amounts"].get("october_amount", 0)
    january_amount = return_summary["gst_amounts"].get("january_amount", 0)
    april_amount = return_summary["gst_amounts"].get("april_amount", 0)

    para.add_run(f'You will receive a total of ').bold = False
    total_run = para.add_run(f"${gst_credit_amount:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' for the ')
    para.add_run(f'GST/ HST credit ').bold = True
    para.add_run(f'as follows:\n')

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2
    
    if july_amount > 0:
        para.add_run(f'July {year_plus1}: ${july_amount:,.2f}\n')
    if october_amount > 0:
        para.add_run(f'October {year_plus1}: ${october_amount:,.2f}\n')
    if january_amount > 0:
        para.add_run(f'January {year_plus2}: ${january_amount:,.2f}\n')
    if april_amount > 0:
        para.add_run(f'April {year_plus2}: ${april_amount:,.2f}\n')

    if isNewcomer:
        para.add_run('\n*Note that you will receive a letter from Canada Revenue Agency asking you to provide your income before arrival to Canada (so from January 1st until the date of arrival). Even though it was mentioned on the declaration, you still need to respond to the letter and provide the amount. If you do not reply, they will not pay the GST amount.\n').italic = True

from docx.shared import RGBColor

# Section: ECGEB Credit
def ecgeb_credit(doc, return_summary, isNewcomer, year):
    para = doc.add_paragraph()
    title_run = para.add_run('ECGEB ')
    title_run.bold = True
    title_run.underline = True
    if isNewcomer:
        title_run = para.add_run('* ')
        title_run.bold = True
        title_run.underline = True
    title_run = para.add_run('Credits:\n')
    title_run.bold = True
    title_run.underline = True

    ecgeb_credit_amount = return_summary["ecgeb_amounts"]["ecgeb_credit_amount"]
    july_amount = return_summary["ecgeb_amounts"].get("july_amount", 0)
    october_amount = return_summary["ecgeb_amounts"].get("october_amount", 0)
    january_amount = return_summary["ecgeb_amounts"].get("january_amount", 0)
    april_amount = return_summary["ecgeb_amounts"].get("april_amount", 0)

    para.add_run(f'You will receive a total of ').bold = False
    total_run = para.add_run(f"${ecgeb_credit_amount:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' for the ')
    para.add_run(f'Canada Groceries and Essentials Benefit (ECGEB) ').bold = True
    para.add_run(f'as follows:\n')

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    if july_amount > 0:
        para.add_run(f'July {year_plus1}: ${july_amount:,.2f}\n')
    if october_amount > 0:
        para.add_run(f'October {year_plus1}: ${october_amount:,.2f}\n')
    if january_amount > 0:
        para.add_run(f'January {year_plus2}: ${january_amount:,.2f}\n')
    if april_amount > 0:
        para.add_run(f'April {year_plus2}: ${april_amount:,.2f}\n')

    if isNewcomer:
        para.add_run('\n*Note that you will receive a letter from Canada Revenue Agency asking you to provide your income before arrival to Canada (so from January 1st until the date of arrival). Even though it was mentioned on the declaration, you still need to respond to the letter and provide the amount. If you do not reply, they will not pay the ECGEB amount.\n').italic = True

# Section: Carbon Rebate
def carbon_rebate(doc, return_summary,  year):
    para = doc.add_paragraph()
    title_run = para.add_run('Carbon Rebate ')
    title_run.bold = True
    title_run.underline = True

    title_run = para.add_run('Credits:\n')

    title_run.bold = True
    title_run.underline = True

    carbon_rebate_amount = return_summary["carbon_rebate_amounts"]["carbon_rebate_amount"]
    july_amount = return_summary["carbon_rebate_amounts"].get("july_amount", 0)
    october_amount = return_summary["carbon_rebate_amounts"].get("october_amount", 0)
    january_amount = return_summary["carbon_rebate_amounts"].get("january_amount", 0)
    april_amount = return_summary["carbon_rebate_amounts"].get("april_amount", 0)

    para.add_run(f'You will receive a total of ').bold = False
    total_run = para.add_run(f"${carbon_rebate_amount:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' for the ')
    para.add_run(f'Canada Carbon Rebate ').bold = True
    para.add_run(f'as follows:\n')

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2
    
    # Updated months order
    if april_amount > 0:
        para.add_run(f'April {year_plus1}: ${april_amount:,.2f}\n')
    if july_amount > 0:
        para.add_run(f'July {year_plus1}: ${july_amount:,.2f}\n')
    if october_amount > 0:
        para.add_run(f'October {year_plus1}: ${october_amount:,.2f}\n')
    if january_amount > 0:
        para.add_run(f'January {year_plus2}: ${january_amount:,.2f}\n')

# Section: Climate Action Credit
def climate_action_credit(doc, return_summary, year):
    para = doc.add_paragraph()
    title_run = para.add_run('Climate Action ')
    title_run.bold = True
    title_run.underline = True

    title_run = para.add_run('Credits:\n')
    title_run.bold = True
    title_run.underline = True

    climate_action_amount = return_summary["climate_action_credit_amounts"]["climate_action_amount"]
    july_amount = return_summary["climate_action_credit_amounts"].get("july_amount", 0)
    october_amount = return_summary["climate_action_credit_amounts"].get("october_amount", 0)
    january_amount = return_summary["climate_action_credit_amounts"].get("january_amount", 0)
    april_amount = return_summary["climate_action_credit_amounts"].get("april_amount", 0)

    para.add_run('You will receive a total of ')
    total_run = para.add_run(f"${climate_action_amount:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(' for the ')
    para.add_run('Climate Action Credit ').bold = True
    para.add_run('as follows:\n')

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    # Print in chronological order: July {year+1}, October {year+1}, January {year+2}, April {year+2}
    if july_amount > 0:
        para.add_run(f"July {year_plus1}: ${july_amount:,.2f}\n")
    if october_amount > 0:
        para.add_run(f"October {year_plus1}: ${october_amount:,.2f}\n")
    if january_amount > 0:
        para.add_run(f"January {year_plus2}: ${january_amount:,.2f}\n")
    if april_amount > 0:
        para.add_run(f"April {year_plus2}: ${april_amount:,.2f}\n")

    return doc

# Section: Ontario Trillium Benefit
def ontario_trillium_benefit(doc, ontario_trillium_result, year):
    para = doc.add_paragraph()
    # Add title directly with bold and underline
    title_run = para.add_run('Ontario Trillium Benefit\n')
    title_run.bold = True
    title_run.underline = True

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    ontario_trillium_amount = ontario_trillium_result["ontario_trillium_amount"]

    para.add_run(f'You will receive a total of ').bold = False
    total_run = para.add_run(f"${ontario_trillium_amount:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' for the ')
    para.add_run(f'Ontario Trillium Benefit ').bold = True
    para.add_run(f'as follows:\n')

    # Extract amounts for each month
    amounts = {
        "July": ontario_trillium_result["july_amount"],
        "August": ontario_trillium_result["august_amount"],
        "September": ontario_trillium_result["september_amount"],
        "October": ontario_trillium_result["october_amount"],
        "November": ontario_trillium_result["november_amount"],
        "December": ontario_trillium_result["december_amount"],
        "January": ontario_trillium_result["january_amount"],
        "February": ontario_trillium_result["february_amount"],
        "March": ontario_trillium_result["march_amount"],
        "April": ontario_trillium_result["april_amount"],
        "May": ontario_trillium_result["may_amount"],
        "June": ontario_trillium_result["june_amount"],
    }

    # Filter out months with a zero amount
    filtered_months = {month: amount for month, amount in amounts.items() if amount > 0}

    if len(filtered_months) <= 4:
        for month, amount in filtered_months.items():
            # Adjust year based on month and year+1 or year+2
            if month in ["July", "August", "September", "October", "November", "December"]:
                para.add_run(f'{month} {year_plus1}: ${amount:,.2f}\n')
            else:
                para.add_run(f'{month} {year_plus2}: ${amount:,.2f}\n')
    else:
        # Check for consistency of amounts for the range
        unique_amounts = set(filtered_months.values())

        if len(unique_amounts) == 1:
            # If all amounts are the same
            amount = next(iter(unique_amounts))  # Get the single value
            para.add_run(f'${amount:,.2f}/month from July {year_plus1} to June {year_plus2}\n')
        else:
            # Group amounts by ranges
            amount_ranges = []
            current_amount = None
            start_month = None

            for month, amount in filtered_months.items():
                # Adjust year based on month
                if month in ["July", "August", "September", "October", "November", "December"]:
                    current_year = year_plus1
                else:
                    current_year = year_plus2

                if current_amount is None:
                    current_amount = amount
                    start_month = month
                elif abs(current_amount - amount) > 0.3:  # Different enough to create a new range
                    amount_ranges.append((start_month, month, current_amount, current_year))
                    current_amount = amount
                    start_month = month

                # Handle the last range
                if month == "June":
                    amount_ranges.append((start_month, month, current_amount, current_year))

            for start, end, amount, end_year in amount_ranges:
                para.add_run(f'${amount:,.2f}/month from {start} {year_plus1} to {end} {end_year}\n')



    
# Section: Summary of Carryforward Amounts
def carryforward_amounts(doc, return_summary):
    para = doc.add_paragraph()
    title_run = para.add_run('Your accumulated tuition fees carried forward to future years:\n')
    title_run.bold = True

    federal_tuition_amount = return_summary["carryforward_amounts"]["federal_tuition_amount"]
    quebec_tuition_8_percent = return_summary["carryforward_amounts"]["quebec_tuition_8_percent"]

    # Convert string values safely (removing commas for conversion)
    if isinstance(federal_tuition_amount, str):
        if federal_tuition_amount.strip():
            federal_tuition_amount = int(federal_tuition_amount.replace(",", ""))
        else:
            federal_tuition_amount = 0
    if isinstance(quebec_tuition_8_percent, str):
        if quebec_tuition_8_percent.strip():
            quebec_tuition_8_percent = int(quebec_tuition_8_percent.replace(",", ""))
        else:
            quebec_tuition_8_percent = 0

    # Format numbers with commas as thousand separators when adding them to the document
    if federal_tuition_amount > 0:
        para.add_run('Federal (eligible to 15%):  $')
        para.add_run(f"{federal_tuition_amount:,}")
    if 'quebec_tuition_8_percent' in locals() and quebec_tuition_8_percent is not None and quebec_tuition_8_percent > 0:
        para.add_run('\nQC (eligible to 8%): $')
        para.add_run(f"{quebec_tuition_8_percent:,}")

    para.add_run(
        '\n\nThose accumulated tuition fees are tax credits that you will be using in future tax declarations when you work '
        'and pay tax on your income.'
    ).italic = True




# Section: Child Benefit Amount
def child_benefit(doc, return_summary, year):
    para = doc.add_paragraph()
    # Add title directly with bold and underline
    title_run = para.add_run('Child Benefit Amounts:\n')
    title_run.bold = True
    title_run.underline = True

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    # Extract total Canada Child Benefit amount
    total_ccb = return_summary["ccb_amounts"]["ccb_amount"]
    amounts = {
        f"July {year_plus1}": return_summary["ccb_amounts"]["july_amount"],
        f"August {year_plus1}": return_summary["ccb_amounts"]["august_amount"],
        f"September {year_plus1}": return_summary["ccb_amounts"]["september_amount"],
        f"October {year_plus1}": return_summary["ccb_amounts"]["october_amount"],
        f"November {year_plus1}": return_summary["ccb_amounts"]["november_amount"],
        f"December {year_plus1}": return_summary["ccb_amounts"]["december_amount"],
        f"January {year_plus2}": return_summary["ccb_amounts"]["january_amount"],
        f"February {year_plus2}": return_summary["ccb_amounts"]["february_amount"],
        f"March {year_plus2}": return_summary["ccb_amounts"]["march_amount"],
        f"April {year_plus2}": return_summary["ccb_amounts"]["april_amount"],
        f"May {year_plus2}": return_summary["ccb_amounts"]["may_amount"],
        f"June {year_plus2}": return_summary["ccb_amounts"]["june_amount"],
    }


    # Display total benefit amount
    para.add_run(f'You will receive a total of ').bold = False
    total_run = para.add_run(f"${total_ccb:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' for the ')
    para.add_run(f'Canada Child Benefit ').bold = True
    para.add_run(f'as follows:\n')

    # Filter out months with a zero amount
    filtered_months = {month: amount for month, amount in amounts.items() if amount > 0}

    if len(filtered_months) <= 4:
        for month, amount in filtered_months.items():
            para.add_run(f'{month}: ${amount:,.2f}\n')
    else:
        # Check for consistency of amounts for the range
        unique_amounts = set(filtered_months.values())

        if len(unique_amounts) == 1:
            # If all amounts are the same
            amount = next(iter(unique_amounts))  # Get the single value
            para.add_run(f'${amount:,.2f}/month from July {year_plus1} to June {year_plus2}')
        else:
            # Group amounts by ranges
            amount_ranges = []
            current_amount = None
            start_month = None
            prev_month = None

            for month, amount in filtered_months.items():
                # Automatically determine the year from month
                year = month.split()[1]  # Extract year from month string

                if current_amount is None:
                    current_amount = amount
                    start_month = month
                elif abs(current_amount - amount) > 0.3:
                    amount_ranges.append((start_month, prev_month, current_amount, year))
                    current_amount = amount
                    start_month = month

                prev_month = month

            # Handle the last range
            if start_month:
                amount_ranges.append((start_month, prev_month, current_amount, year))

            for start, end, amount, year in amount_ranges:
                if start == end:
                    para.add_run(f'${amount:,.2f} in {start}\n')
                else:
                    para.add_run(f'${amount:,.2f}/month from {start} to {end}\n')

# Section: Quebec Family Allowance
def quebec_family_allowance(doc, return_summary, year):
    para = doc.add_paragraph()

    total_allowance_amount = return_summary["family_allowance_amounts"]["fa_amount"]

    para.add_run(f'You will receive a total of ').bold = False
    total_run = para.add_run(f"${total_allowance_amount:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' for the ')
    para.add_run(f'Quebec Family Allowance ').bold = True
    para.add_run(f'as follows:\n')

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    july_amount = return_summary["family_allowance_amounts"]["july_amount"]
    october_amount = return_summary["family_allowance_amounts"]["october_amount"]
    january_amount = return_summary["family_allowance_amounts"]["january_amount"]
    april_amount = return_summary["family_allowance_amounts"]["april_amount"]

    if july_amount > 0:
        para.add_run(f'July {year_plus1}: ${july_amount:,.2f}\n')
    if october_amount > 0:
        para.add_run(f'October {year_plus1}: ${october_amount:,.2f}\n')
    if january_amount > 0:
        para.add_run(f'January {year_plus2}: ${january_amount:,.2f}\n')
    if april_amount > 0:
        para.add_run(f'April {year_plus2}: ${april_amount:,.2f}\n')

# Section: Conclusion
def conclusion(doc, isMailQC=False):
    para = doc.add_paragraph()

    # Add the red text above the conclusion
    # Use singular "form" for Efile fed mail QC (Individual), plural "forms" otherwise
    form_text = "form" if isMailQC else "forms"
    red_run = para.add_run(f'\nWe will be waiting for the signed authorization {form_text} to proceed.\n')
    red_run.font.color.rgb = RGBColor(205, 52, 78)

    # Add normal text for "Thank you."
    para.add_run('\nThank you.\n')

    # Add the main conclusion text with specified formatting
    conclusion_run = para.add_run(
        '\nWe at Sankari Inc. are pleased to respond to your tax inquiries and/or file your tax returns based on the '
        'information that you provide. Inaccurate or incomplete information provided by you may lead to inadequate or '
        'incorrect advice for which Sankari Inc. team cannot be held responsible. You, the client, are responsible for '
        'giving correct information and documentation to Sankari Inc.'
    )
    # Set the font size to 8pt, color to black with 50% lighter, and italicize
    conclusion_run.font.size = Pt(8)
    conclusion_run.font.color.rgb = RGBColor(127, 127, 127)
    conclusion_run.italic = True

def createIndividualWordDocFR(individual, output_file_path):
    return_summary = individual['summary']
    year = individual['year']
    ind_title = individual['title']
    if individual['title'] == 'Mr':
        ind_title = "M."
    elif individual['title'] == 'Ms' or individual['title'] == 'Mrs':
        ind_title = "Mme"
    isMailQC = individual['isMailQC']
    isNewcomer = individual['isNewcomer']
    doc = Document()

    set_default_font(doc, "Calibri", 10)
    section_1FR(doc, return_summary, ind_title, year, isMailQC)
    tax_returnFR(doc, return_summary, year)

    if "gst_amounts" in return_summary and return_summary["gst_amounts"]:
        gst_creditFR(doc, return_summary, isNewcomer, year)

    if "ecgeb_amounts" in return_summary and return_summary["ecgeb_amounts"]:
        ecgeb_creditFR(doc, return_summary, isNewcomer, year)

    if "solidarity_amounts" in return_summary and return_summary["solidarity_amounts"]:
        solidarity_creditFR(doc, return_summary, year)

    if "carbon_rebate_amounts" in return_summary and return_summary["carbon_rebate_amounts"]:
        carbon_rebateFR(doc, return_summary, year)

    if "ccb_amounts" in return_summary and return_summary["ccb_amounts"]:
        child_benefitFR(doc, return_summary, year)

    if "family_allowance_amounts" in return_summary and return_summary["family_allowance_amounts"]:
        quebec_family_allowanceFR(doc, return_summary, year)

    if "carryforward_amounts" in return_summary and return_summary["carryforward_amounts"]:
        carryforward_amountsFR(doc, return_summary)

    conclusionFR(doc, isMailQC)
    # Save the document in the specified path
    doc.save(output_file_path)

def createCoupleWordDocFR(couple_summaries, output_file_path):
    doc = Document()

    # Set default font to Calibri and size 10pt for the entire document
    set_default_font(doc, "Calibri", 10)

    # Initialize variables to track the year, isMailQC, and isNewcomer
    year = couple_summaries[0]['year']
    isMailQC = False
    isNewcomer = False

    for individual in couple_summaries:
        if individual['isMailQC']:
            isMailQC = True
        if individual['isNewcomer']:
            isNewcomer = True

    # Process the primary individual
    primary_individual = next(individual for individual in couple_summaries if individual['isPrimary'])
    secondary_individual = next(individual for individual in couple_summaries if not individual['isPrimary'])

    primary_title = primary_individual['title']
    if primary_individual['title'] == 'Mr':
        primary_title = "M."
    elif individual['title'] == 'Ms' or individual['title'] == 'Mrs':
        primary_title = "Mme"

    secondary_title = secondary_individual['title']
    if secondary_individual['title'] == 'Mr':
        secondary_title = "M."
    elif secondary_individual['title'] == 'Ms' or secondary_individual['title'] == 'Mrs':
        secondary_title = "Mme"

    section_1FR(doc, primary_individual['summary'], primary_title, year, isMailQC, couple=True, secondary_summary=secondary_individual['summary'], secondary_ind_title=secondary_title)
    tax_returnFR(doc, primary_individual['summary'], year,  secondary_individual['summary'], primary_title, secondary_title, isCouple=True),

    for individual in couple_summaries:
        return_summary = individual['summary']
        if "gst_amounts" in return_summary and return_summary["gst_amounts"]:
            gst_creditFR(doc, return_summary, isNewcomer, year)

        if "ecgeb_amounts" in return_summary and return_summary["ecgeb_amounts"]:
            ecgeb_creditFR(doc, return_summary, isNewcomer, year)

        if "solidarity_amounts" in return_summary and return_summary["solidarity_amounts"]:
            solidarity_creditFR(doc, return_summary, year)

        if "carbon_rebate_amounts" in return_summary and return_summary["carbon_rebate_amounts"]:
            carbon_rebateFR(doc, return_summary, year)


        if "ccb_amounts" in return_summary and return_summary["ccb_amounts"]:
            child_benefitFR(doc, return_summary, year)

        if "family_allowance_amounts" in return_summary and return_summary["family_allowance_amounts"]:
            quebec_family_allowanceFR(doc, return_summary, year)

    conclusionFR(doc, isMailQC=isMailQC)

    # Save the document in the specified path
    doc.save(output_file_path)

def section_1FR(doc, return_summary, ind_title, year, isMailQC, couple=False, secondary_summary=None, secondary_ind_title=None):
    # Title: Centered, Dark Gray, 14pt, Calibri
    if couple:
        title = doc.add_paragraph(f'Sommaire de vos déclarations d’impôts {year}')
    else:
        title = doc.add_paragraph(f'Sommaire de votre déclaration d’impôts {year}')
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.runs[0]
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(65, 65, 65)

    # Recipient Name
    para = doc.add_paragraph()
    first_name = return_summary["tax_summary"]["first_name"]
    last_name = return_summary["tax_summary"]["last_name"]
    province = return_summary["tax_summary"]["province"]
    para.add_run(f"{ind_title} {last_name}")

    # Display Secondary Individual's name if applicable
    if couple and secondary_summary is not None and secondary_ind_title is not None:
        secondary_first_name = secondary_summary["tax_summary"]["first_name"]
        secondary_last_name = secondary_summary["tax_summary"]["last_name"]
        para.add_run(f" & {secondary_ind_title} {secondary_last_name}")

    # Introduction paragraph
    para = doc.add_paragraph()
    para.add_run(f'Nous avons joint à ce courriel tous les documents de {'vos déclarations' if couple else 'votre déclaration'} d’impôts {year}. ').bold = False
    para.add_run('Le mot de passe se compose des neuf chiffres de votre numéro d’assurance sociale.\n').bold = True
    if couple:
        para.add_run('Le document nommé COPIE est une copie complète de votre déclaration de revenus. ').bold = False
        para.add_run('Vous n\'avez pas besoin de les imprimer ou de les signer; ').bold = True
        para.add_run('vous avez juste besoin de les retenir pour votre dossier. Veuillez revoir les déclarations de revenu attentivement afin de vous assurer qu’elles sont exactes et complètes.\n').bold = False

    else:    
        para.add_run('Le document nommé COPIE est une copie complète de votre déclaration de revenus. ').bold = False
        para.add_run('Vous n\'avez pas besoin de l’imprimer ou de le signer; ').bold = True
        para.add_run('vous avez juste besoin de le retenir pour votre dossier. Veuillez revoir la déclaration de revenu attentivement afin de vous assurer qu’elle est exacte et complète.').bold = False

    # "Very Important" without extra paragraph spacing
    very_important_run = para.add_run('\n\n** TRÈS IMPORTANT :\n')
    very_important_run.bold = True
    very_important_run.underline = True
    very_important_run.font.color.rgb = RGBColor(205, 52, 78)

    if province == "Québec":

        if isMailQC:
            # Special message if isMailQC is True
            # Federal tax return
            federal_title_run = para.add_run('Déclaration Fédérale :\n')
            federal_title_run.bold = True
            federal_title_run.underline = True
            para.add_run('Notez que votre déclaration d’impôt Fédérale ').bold = True
            federal_advisory_run = para.add_run('n’a pas encore été soumise ')
            federal_advisory_run.bold = True
            federal_advisory_run.underline = True
            para.add_run('au gouvernement via EFile.\n').bold = True

            para.add_run(f'Vous trouverez ci-joint {'deux formulaires' if couple else 'un formulaire'}  d’autorisation. Veuillez le signer électroniquement (ou imprimer/signer) et nous l’envoyer par courriel le plus tôt possible afin que nous puissions transmettre votre déclaration par EFILE.\n')
            para.add_run('S’il vous plaît signer la partie F.\n\n')

            # Québec tax return
            quebec_title_run = para.add_run('Déclaration Provinciale :\n')
            quebec_title_run.bold = True
            quebec_title_run.underline = True

            para.add_run('Veuillez noter que votre déclaration provinciale ne peut pas être transmise via Efile.\n')
            if couple and secondary_summary is not None:
                para.add_run(f'Pour cette raison, vous devez imprimer le document “QC {year} - {first_name} {last_name}.pdf” et “QC {year} - {secondary_first_name} {secondary_last_name}.pdf”, signer en bas de la page ##, et l’envoyer par la poste à l’adresse suivante :\n')
            else:
                para.add_run(f'Pour cette raison, vous devez imprimer le document “QC {year} - {first_name} {last_name}.pdf”, signer en bas de la page ##, et l’envoyer par la poste à l’adresse suivante :\n')

            # Address in italics
            address = para.add_run('Revenu Québec\nC. P. 2500, succursale Place-Desjardins\nMontréal (Québec) H5B 1A3\n\n')
            address.italic = True

            para.add_run('*Si vous souhaitez qu’on s’occupe d’envoyer la déclaration par la poste à Revenu QC, veuillez nous envoyer par courriel la déclaration signée (par signature électronique qui ressemble à votre signature) et nous l’imprimerons et l’enverrons par courrier recommandé (avec un numéro de suivi) à Revenu QC. ')
            para.add_run('Veuillez noter qu\'il y aura des frais de service supplémentaires de 25 $ plus les frais de Postes Canada.\n')
        else:
            # Original message if isMailQC is False
            para.add_run('Notez que votre déclaration d’impôt ').bold = True
            bold_underline_run = para.add_run('n’a pas encore été soumise ')
            bold_underline_run.bold = True
            bold_underline_run.underline = True
            para.add_run('au gouvernement via EFile.\n').bold = True
            para.add_run(f'Vous trouverez ci-joint {'quatre' if couple else 'deux'} formulaires d’autorisation. Veuillez les signer électroniquement (ou imprimer/signer) et nous les envoyer par courriel le plus tôt possible afin que nous puissions transmettre votre déclaration par EFILE.\n')
            para.add_run('Pour le formulaire Fédéral, veuillez signer ').italic = True
            bold_part_f = para.add_run('la partie F.')
            bold_part_f.bold = True
            bold_part_f.italic = True
            para.add_run('\nPour le formulaire du Québec, veuillez signer à la fin de ').italic = True
            bold_section_4 = para.add_run('la section 4.')
            bold_section_4.bold = True
            bold_section_4.italic = True
    else:
        # Original message if isMailQC is False
        para.add_run('Noter que votre déclaration d’impôt ').bold = True
        bold_underline_run = para.add_run('n’a pas encore été soumise ')
        bold_underline_run.bold = True
        bold_underline_run.underline = True
        para.add_run('au gouvernement via EFile.\n').bold = True
        para.add_run(f'Vous trouverez ci-joint {'deux formulaires' if couple else 'une formulaire'}  d’autorisation. Veuillez les signer électroniquement (ou imprimer/signer) et nous les envoyer par courriel le plus tôt possible afin que nous puissions transmettre votre déclaration par EFILE.\n')
        para.add_run('Veuillez signer ').italic = True
        bold_part_f = para.add_run('la partie F.')
        bold_part_f.bold = True
        bold_part_f.italic = True

def tax_returnFR(doc, return_summary, year, secondary_summary=None, primary_title=None, secondary_title=None, isCouple=False):
    province = return_summary["tax_summary"]["province"]

    para = doc.add_paragraph()

    # Add "RÉSULTATS" title in bold and red
    bold_red_results = para.add_run('RÉSULTATS\n')
    bold_red_results.bold = True
    bold_red_results.font.color.rgb = RGBColor(205, 52, 78)
    
    
    # Helper function for formatting numbers in the French style
    def format_french_number(amount):
        return f"{amount:,.2f}".replace(",", " ").replace(".", ",")

    # Federal and Quebec Tax Return for primary individual
    if isCouple:
      para.add_run(f"\n{primary_title} {return_summary['tax_summary']['last_name']}\n")

    # Federal Tax Return
    para.add_run('Déclaration Fédérale\n').bold = True
    federal_refund = return_summary["tax_summary"]["federal_refund"]
    federal_owing = return_summary["tax_summary"]["federal_owing"] 

    if federal_refund > 2:
        para.add_run("Vous avez droit à un remboursement de ").bold = False
        refund_run = para.add_run(f"{format_french_number(federal_refund)} $\n")
        refund_run.bold = True
        refund_run.font.color.rgb = RGBColor(0, 128, 0)
    elif federal_owing > 2:
        para.add_run("Vous avez un montant dû de ").bold = False
        owing_run = para.add_run(f"{format_french_number(federal_owing)} $\n")
        owing_run.bold = True
        owing_run.font.color.rgb = RGBColor(255, 0, 0)
    else:
        para.add_run("Vous n'avez pas de remboursement ni de montant dû.\n")

    if province == "Québec":
    # Quebec Tax Return
        para.add_run('Déclaration Provinciale\n').bold = True
        quebec_refund = return_summary["tax_summary"]["quebec_refund"]
        quebec_owing = return_summary["tax_summary"]["quebec_owing"]

        if quebec_refund > 2:
            para.add_run("Vous avez droit à un remboursement de ").bold = False
            refund_run = para.add_run(f"{format_french_number(quebec_refund)} $\n")
            refund_run.bold = True
            refund_run.font.color.rgb = RGBColor(0, 128, 0)
        elif quebec_owing > 2:
            para.add_run("Vous avez un montant dû de ").bold = False
            owing_run = para.add_run(f"{format_french_number(quebec_owing)} $\n")
            owing_run.bold = True
            owing_run.font.color.rgb = RGBColor(255, 0, 0)
        else:
            para.add_run("Vous n'avez pas de remboursement ni de montant dû.\n")

    # Add payment section for the primary individual
    quebec_owing = locals().get('quebec_owing', 0)

    if federal_owing > 2 or quebec_owing > 2:

        para = doc.add_paragraph()
        para.add_run('Vous devez un montant à votre ').italic = True

        if federal_owing > 2 and quebec_owing > 2:
            para.add_run('déclaration fédérale et provinciale; ').italic = True
        elif federal_owing > 2:
            para.add_run('déclaration fédérale; ').italic = True
        elif quebec_owing > 2:
            para.add_run('déclaration provinciale; ').italic = True

        para.add_run(f'assurez-vous de payer le solde dû avant le 30 avril {int(year) + 1} pour éviter de payer des intérêts. ').italic = True
        para.add_run('Veuillez attendre quelques jours après la transmission Efile pour payer votre solde dû. ').italic = True
        para.add_run('Pour plus de détails sur la façon de payer le montant dû, veuillez cliquer sur : ').italic = True

        # Add hyperlinks for payment details
        if federal_owing > 2:
            add_hyperlink(para, 'Fédéral', 'https://www.canada.ca/fr/agence-revenu/services/paiements/paiements-arc.html')
        if federal_owing > 0 and quebec_owing > 2:
            para.add_run(' et ')
        if quebec_owing > 2:
            add_hyperlink(para, 'Québec', 'https://www.revenuquebec.ca/fr/citoyens/declaration-de-revenus/payer-ou-etre-rembourse/solde-dimpot-a-payer/')
        para.add_run('\n')

    # Carryforward amounts
    if isCouple and "carryforward_amounts" in return_summary and return_summary["carryforward_amounts"]:
        para = doc.add_paragraph()
        title_run = para.add_run('Vos Frais de scolarité reportés aux années futures sont :\n')
        title_run.bold = True

        federal_tuition_amount = return_summary["carryforward_amounts"]["federal_tuition_amount"]
        quebec_tuition_8_percent = return_summary["carryforward_amounts"]["quebec_tuition_8_percent"]

        # Ensure amounts are numeric (float or int)
        if isinstance(federal_tuition_amount, str):
            if federal_tuition_amount.strip():  # Check if not empty
                federal_tuition_amount = int(federal_tuition_amount)
            else:
                federal_tuition_amount = 0

        if isinstance(quebec_tuition_8_percent, str):
            if quebec_tuition_8_percent.strip():  # Check if not empty
                quebec_tuition_8_percent = int(quebec_tuition_8_percent)
            else:
                quebec_tuition_8_percent = 0

        # Format the amounts without decimals and replace commas with spaces
        formatted_federal_amount = locale.format_string("%d", federal_tuition_amount, grouping=True).replace(",", " ")
        formatted_quebec_amount = locale.format_string("%d", quebec_tuition_8_percent, grouping=True).replace(",", " ")

        # Add formatted amounts to the paragraph
        if federal_tuition_amount > 0:
            para.add_run('Fédéral (admissible à 15%) : ')
            para.add_run(f"{formatted_federal_amount} $")
        if 'quebec_tuition_8_percent' in locals() and quebec_tuition_8_percent is not None and quebec_tuition_8_percent > 0:
            para.add_run('\nQC (admissible à 8%) : ')
            para.add_run(f"{formatted_quebec_amount} $")

        # Add additional explanatory text
        para.add_run(
            '\n\nCes frais de scolarité accumulés sont des crédits d\'impôt que vous allez utiliser dans vos futures déclarations, lorsque vous générez un revenu et payez des impôts.'
        ).italic = True

    # Process secondary individual if applicable
    if isCouple and secondary_summary:
        para.add_run(f"\n{secondary_title} {secondary_summary['tax_summary']['last_name']}\n")

        # Federal Tax Return for secondary individual
        para.add_run('Déclaration Fédérale\n').bold = True
        federal_refund = secondary_summary["tax_summary"]["federal_refund"]
        federal_owing = secondary_summary["tax_summary"]["federal_owing"]

        if federal_refund > 2:
            para.add_run("Vous avez droit à un remboursement de ").bold = False
            refund_run = para.add_run(f"{format_french_number(federal_refund)} $\n")
            refund_run.bold = True
            refund_run.font.color.rgb = RGBColor(0, 128, 0)
        elif federal_owing > 2:
            para.add_run("Vous avez un montant dû de ").bold = False
            owing_run = para.add_run(f"{format_french_number(federal_owing)} $\n")
            owing_run.bold = True
            owing_run.font.color.rgb = RGBColor(255, 0, 0)
        else:
            para.add_run("Vous n'avez pas de remboursement ni de montant dû.\n")
        if province == "Québec":
            # Quebec Tax Return for secondary individual
            para.add_run('Déclaration Provinciale\n').bold = True
            quebec_refund = secondary_summary["tax_summary"]["quebec_refund"]
            quebec_owing = secondary_summary["tax_summary"]["quebec_owing"]

            if quebec_refund > 2:
                para.add_run("Vous avez droit à un remboursement de ").bold = False
                refund_run = para.add_run(f"{format_french_number(quebec_refund)} $\n")
                refund_run.bold = True
                refund_run.font.color.rgb = RGBColor(0, 128, 0)
            elif quebec_owing > 2:
                para.add_run("Vous avez un montant dû de ").bold = False
                owing_run = para.add_run(f"{format_french_number(quebec_owing)} $\n")
                owing_run.bold = True
                owing_run.font.color.rgb = RGBColor(255, 0, 0)
            else:
                para.add_run("Vous n'avez pas de remboursement ni de montant dû.\n")

        # Add payment section for the secondary individual
        quebec_owing = locals().get('quebec_owing', 0)

        if federal_owing > 2 or quebec_owing > 2:

            para = doc.add_paragraph()
            para.add_run('Vous devez un montant à votre ').italic = True

            if federal_owing > 2 and quebec_owing > 2:
                para.add_run('déclaration fédérale et provinciale; ').italic = True
            elif federal_owing > 2:
                para.add_run('déclaration fédérale; ').italic = True
            elif quebec_owing > 2:
                para.add_run('déclaration provinciale; ').italic = True

            para.add_run(f'assurez-vous de payer le solde dû avant le 30 avril {int(year) + 1} pour éviter de payer des intérêts. ').italic = True
            para.add_run('Veuillez attendre quelques jours après la transmission Efile pour payer votre solde dû. ').italic = True
            para.add_run('Pour plus de détails sur la façon de payer le montant dû, veuillez cliquer sur : ').italic = True

            # Add hyperlinks for payment details
            if federal_owing > 2:
                add_hyperlink(para, 'Fédéral', 'https://www.canada.ca/fr/agence-revenu/services/paiements/paiements-arc.html')
            if federal_owing > 0 and quebec_owing > 2:
                para.add_run(' et ')
            if quebec_owing > 2:
                add_hyperlink(para, 'Québec', 'https://www.revenuquebec.ca/fr/citoyens/declaration-de-revenus/payer-ou-etre-rembourse/solde-dimpot-a-payer/')
            para.add_run('\n')

        if "carryforward_amounts" in secondary_summary and secondary_summary["carryforward_amounts"]:
            para = doc.add_paragraph()
            title_run = para.add_run('Vos Frais de scolarité reportés aux années futures sont :\n')
            title_run.bold = True

            federal_tuition_amount = secondary_summary["carryforward_amounts"]["federal_tuition_amount"]
            quebec_tuition_8_percent = secondary_summary["carryforward_amounts"]["quebec_tuition_8_percent"]

            # Ensure amounts are numeric (float or int)
            if isinstance(federal_tuition_amount, str):
                if federal_tuition_amount.strip():  # Check if not empty
                    federal_tuition_amount = int(federal_tuition_amount)
                else:
                    federal_tuition_amount = 0

            if isinstance(quebec_tuition_8_percent, str):
                if quebec_tuition_8_percent.strip():  # Check if not empty
                    quebec_tuition_8_percent = int(quebec_tuition_8_percent)
                else:
                    quebec_tuition_8_percent = 0

            # Format the amounts without decimals and replace commas with spaces
            formatted_federal_amount = locale.format_string("%d", federal_tuition_amount, grouping=True).replace(",", " ")
            formatted_quebec_amount = locale.format_string("%d", quebec_tuition_8_percent, grouping=True).replace(",", " ")

            # Add formatted amounts to the paragraph
            if federal_tuition_amount > 0:
                para.add_run('Fédéral (admissible à 15%) : ')
                para.add_run(f"{formatted_federal_amount} $")
            if 'quebec_tuition_8_percent' in locals() and quebec_tuition_8_percent is not None and quebec_tuition_8_percent > 0:
                para.add_run('\nQC (admissible à 8%) : ')
                para.add_run(f"{formatted_quebec_amount} $")

            # Add additional explanatory text
            para.add_run(
                '\n\nCes frais de scolarité accumulés sont des crédits d\'impôt que vous allez utiliser dans vos futures déclarations, lorsque vous générez un revenu et payez des impôts.'
            ).italic = True

def solidarity_creditFR(doc, return_summary, year):
    para = doc.add_paragraph()

    # Add title with bold and underline
    title_run = para.add_run('Crédits de solidarité\n')
    title_run.bold = True
    title_run.underline = True

    year_plus1 = int(year )+ 1
    year_plus2 = int(year) + 2  

    # Extract the total solidarity credit amount
    solidarity_amount = return_summary["solidarity_amounts"]["solidarity_credit_amount"]

    # Add the formatted total amount to the paragraph
    para.add_run(f'Vous allez recevoir un total de ').bold = False
    total_run = para.add_run(format_currency(solidarity_amount))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour le crédit de ').bold = False
    para.add_run(f'Solidarité ').bold = True
    para.add_run(f'de la façon suivante :\n')

    # Extract amounts for each month
    amounts = {
        "Juillet": return_summary["solidarity_amounts"]["july_amount"],
        "Août": return_summary["solidarity_amounts"]["august_amount"],
        "Septembre": return_summary["solidarity_amounts"]["september_amount"],
        "Octobre": return_summary["solidarity_amounts"]["october_amount"],
        "Novembre": return_summary["solidarity_amounts"]["november_amount"],
        "Décembre": return_summary["solidarity_amounts"]["december_amount"],
        "Janvier": return_summary["solidarity_amounts"]["january_amount"],
        "Février": return_summary["solidarity_amounts"]["february_amount"],
        "Mars": return_summary["solidarity_amounts"]["march_amount"],
        "Avril": return_summary["solidarity_amounts"]["april_amount"],
        "Mai": return_summary["solidarity_amounts"]["may_amount"],
        "Juin": return_summary["solidarity_amounts"]["june_amount"],
    }

    # Filter out months with zero amounts
    filtered_months = {month: amount for month, amount in amounts.items() if amount > 0}

    # If there are 4 or fewer months with non-zero amounts
    if len(filtered_months) <= 4:
        for month, amount in filtered_months.items():
            year = year_plus1 if month in ["Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"] else year_plus2
            para.add_run(f'{month} {year} : {format_currency(amount)}\n')
    else:
        # Check for consistency of amounts across the range
        unique_amounts = set(filtered_months.values())

        if len(unique_amounts) == 1:
            # All amounts are the same, show it for the full period
            amount = next(iter(unique_amounts))  # Get the single unique amount
            para.add_run(f'{format_currency(amount)} /mois de Juillet {year_plus1} à Juin {year_plus2}\n')
        else:
            # Group amounts by ranges if they differ
            amount_ranges = []
            current_amount = None
            start_month = None

            for month, amount in filtered_months.items():
                year = year_plus1 if month in ["Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"] else year_plus2
                if current_amount is None:
                    current_amount = amount
                    start_month = month
                elif abs(current_amount - amount) > 0.3:  # Change detected, create a new range
                    amount_ranges.append((start_month, month, current_amount, year))
                    current_amount = amount
                    start_month = month

                # Handle the last range (up to June)
                if month == "Juin":
                    amount_ranges.append((start_month, month, current_amount, year_plus2))

            # Display each range
            for start, end, amount, end_year in amount_ranges:
                para.add_run(f'{format_currency(amount)} /mois de {start} {year_plus1} à {end} {end_year}\n')


def gst_creditFR(doc, return_summary, isNewcomer, year):
    para = doc.add_paragraph()

    # Add title with bold and underline
    title_run = para.add_run('Crédits TPS')
    title_run.bold = True
    title_run.underline = True

    if isNewcomer:
        title_run = para.add_run('* ')
        title_run.bold = True
        title_run.underline = True

    # Continue with title
    title_run = para.add_run(' :\n')
    title_run.bold = True
    title_run.underline = True

    # Extract GST credit amounts
    gst_credit_amount = return_summary["gst_amounts"]["gst_credit_amount"]
    july_amount = return_summary["gst_amounts"].get("july_amount", 0)
    october_amount = return_summary["gst_amounts"].get("october_amount", 0)
    january_amount = return_summary["gst_amounts"].get("january_amount", 0)
    april_amount = return_summary["gst_amounts"].get("april_amount", 0)

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    # Format amounts using the helper function
    formatted_total_gst = format_currency(gst_credit_amount)

    # Add formatted total amount to the paragraph
    para.add_run(f'Vous allez recevoir un total de ').bold = False
    total_run = para.add_run(formatted_total_gst)
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour les crédits ')
    para.add_run(f'TPS ').bold = True
    para.add_run(f'de la façon suivante :\n')

    # Add the amounts for each month, only if greater than 0
    if july_amount > 0:
        para.add_run(f'Juillet {year_plus1} : {format_currency(july_amount)}\n')
    if october_amount > 0:
        para.add_run(f'Octobre {year_plus1} : {format_currency(october_amount)}\n')
    if january_amount > 0:
        para.add_run(f'Janvier {year_plus2} : {format_currency(january_amount)}\n')
    if april_amount > 0:
        para.add_run(f'Avril {year_plus2} : {format_currency(april_amount)}\n')

    # Newcomer note
    if isNewcomer:
        para.add_run(
            '\n*Notez que vous allez recevoir une lettre de l\'Agence du Revenu du Canada vous demandant de fournir vos revenus avant votre arrivée au Canada (du 1er janvier jusqu\'à la date d\'arrivée). '
            'Même si cela a été mentionné sur la déclaration, vous devez quand même répondre à la lettre. Si vous ne répondez pas, ils ne paieront pas le montant de la TPS.\n'
        ).italic = True


def ecgeb_creditFR(doc, return_summary, isNewcomer, year):
    para = doc.add_paragraph()

    title_run = para.add_run('Crédits ACEBE')
    title_run.bold = True
    title_run.underline = True

    if isNewcomer:
        title_run = para.add_run('* ')
        title_run.bold = True
        title_run.underline = True

    title_run = para.add_run(' :\n')
    title_run.bold = True
    title_run.underline = True

    ecgeb_credit_amount = return_summary["ecgeb_amounts"]["ecgeb_credit_amount"]
    july_amount = return_summary["ecgeb_amounts"].get("july_amount", 0)
    october_amount = return_summary["ecgeb_amounts"].get("october_amount", 0)
    january_amount = return_summary["ecgeb_amounts"].get("january_amount", 0)
    april_amount = return_summary["ecgeb_amounts"].get("april_amount", 0)

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    formatted_total = format_currency(ecgeb_credit_amount)

    para.add_run(f'Vous allez recevoir un total de ').bold = False
    total_run = para.add_run(formatted_total)
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour la ')
    para.add_run(f'Allocation canadienne pour l\'épicerie et les besoins essentiels (ACEBE) ').bold = True
    para.add_run(f'de la façon suivante :\n')

    if july_amount > 0:
        para.add_run(f'Juillet {year_plus1} : {format_currency(july_amount)}\n')
    if october_amount > 0:
        para.add_run(f'Octobre {year_plus1} : {format_currency(october_amount)}\n')
    if january_amount > 0:
        para.add_run(f'Janvier {year_plus2} : {format_currency(january_amount)}\n')
    if april_amount > 0:
        para.add_run(f'Avril {year_plus2} : {format_currency(april_amount)}\n')

    if isNewcomer:
        para.add_run(
            '\n*Notez que vous allez recevoir une lettre de l\'Agence du Revenu du Canada vous demandant de fournir vos revenus avant votre arrivée au Canada (du 1er janvier jusqu\'à la date d\'arrivée). '
            'Même si cela a été mentionné sur la déclaration, vous devez quand même répondre à la lettre. Si vous ne répondez pas, ils ne paieront pas le montant de la ACEBE.\n'
        ).italic = True


def carryforward_amountsFR(doc, return_summary):
    para = doc.add_paragraph()
    title_run = para.add_run('Vos Frais de scolarité reportés aux années futures sont :\n')
    title_run.bold = True

    federal_tuition_amount = return_summary["carryforward_amounts"]["federal_tuition_amount"]
    quebec_tuition_8_percent = return_summary["carryforward_amounts"]["quebec_tuition_8_percent"]

    # Ensure amounts are numeric (float or int)
    if isinstance(federal_tuition_amount, str):
        if federal_tuition_amount.strip():  # Check if not empty
            federal_tuition_amount = int(federal_tuition_amount)
        else:
            federal_tuition_amount = 0

    if isinstance(quebec_tuition_8_percent, str):
        if quebec_tuition_8_percent.strip():  # Check if not empty
            quebec_tuition_8_percent = int(quebec_tuition_8_percent)
        else:
            quebec_tuition_8_percent = 0

    # Format the amounts without decimals and replace commas with spaces
    formatted_federal_amount = locale.format_string("%d", federal_tuition_amount, grouping=True).replace(",", " ")
    formatted_quebec_amount = locale.format_string("%d", quebec_tuition_8_percent, grouping=True).replace(",", " ")

    # Add formatted amounts to the paragraph
    if federal_tuition_amount > 0:
        para.add_run('Fédéral (admissible à 15%) : ')
        para.add_run(f"{formatted_federal_amount} $")
    if 'quebec_tuition_8_percent' in locals() and quebec_tuition_8_percent is not None and quebec_tuition_8_percent > 0:
        para.add_run('\nQC (admissible à 8%) : ')
        para.add_run(f"{formatted_quebec_amount} $")

    # Add additional explanatory text
    para.add_run(
        '\n\nCes frais de scolarité accumulés sont des crédits d\'impôt que vous allez utiliser dans vos futures déclarations, lorsque vous générez un revenu et payez des impôts.'
    ).italic = True

def carbon_rebateFR(doc, return_summary, year):
    para = doc.add_paragraph()
    title_run = para.add_run('Remise Canadienne sur le Carbone : \n')
    title_run.bold = True
    title_run.underline = True

    carbon_rebate_amount = return_summary["carbon_rebate_amounts"]["carbon_rebate_amount"]
    july_amount = return_summary["carbon_rebate_amounts"].get("july_amount", 0)
    october_amount = return_summary["carbon_rebate_amounts"].get("october_amount", 0)
    january_amount = return_summary["carbon_rebate_amounts"].get("january_amount", 0)
    april_amount = return_summary["carbon_rebate_amounts"].get("april_amount", 0)

    para.add_run(f'Vous recevrez un total de ').bold = False
    total_run = para.add_run(f"${carbon_rebate_amount:,.2f}".replace(',', ' ').replace('.', ','))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour la ')
    para.add_run(f'Remise canadienne sur le carbone ').bold = True
    para.add_run(f'distribuée comme suit :\n')

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    # Updated months order
    if april_amount > 0:
        para.add_run(f'Avril {year_plus1} : ${format(april_amount, ",.2f").replace(",", " ").replace(".", ",")}\n')
    if july_amount > 0:
        para.add_run(f'Juillet {year_plus1} : ${format(july_amount, ",.2f").replace(",", " ").replace(".", ",")}\n')
    if october_amount > 0:
        para.add_run(f'Octobre {year_plus1} : ${format(october_amount, ",.2f").replace(",", " ").replace(".", ",")}\n')
    if january_amount > 0:
        para.add_run(f'Janvier {year_plus2} : ${format(january_amount, ",.2f").replace(",", " ").replace(".", ",")}\n')



def child_benefitFR(doc, return_summary, year):
    para = doc.add_paragraph()
    # Add title directly with bold and underline
    title_run = para.add_run('Prestations pour Enfants :\n')
    title_run.bold = True
    title_run.underline = True

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    # Extract total Canada Child Benefit amount
    total_ccb = return_summary["ccb_amounts"]["ccb_amount"]
    amounts = {
        f"Juillet {year_plus1}": return_summary["ccb_amounts"]["july_amount"],
        f"Août {year_plus1}": return_summary["ccb_amounts"]["august_amount"],
        f"Septembre {year_plus1}": return_summary["ccb_amounts"]["september_amount"],
        f"Octobre {year_plus1}": return_summary["ccb_amounts"]["october_amount"],
        f"Novembre {year_plus1}": return_summary["ccb_amounts"]["november_amount"],
        f"Décembre {year_plus1}": return_summary["ccb_amounts"]["december_amount"],
        f"Janvier {year_plus2}": return_summary["ccb_amounts"]["january_amount"],
        f"Février {year_plus2}": return_summary["ccb_amounts"]["february_amount"],
        f"Mars {year_plus2}": return_summary["ccb_amounts"]["march_amount"],
        f"Avril {year_plus2}": return_summary["ccb_amounts"]["april_amount"],
        f"Mai {year_plus2}": return_summary["ccb_amounts"]["may_amount"],
        f"Juin {year_plus2}": return_summary["ccb_amounts"]["june_amount"],
    }

    # Display total benefit amount with French number formatting
    para.add_run(f'Vous allez recevoir un total de ').bold = False
    total_run = para.add_run(format_currency(total_ccb))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour ')
    para.add_run(f'l’Allocation canadienne pour enfants ').bold = True
    para.add_run(f'de la façon suivante :\n')

    # Filter out months with a zero amount
    filtered_months = {month: amount for month, amount in amounts.items() if amount > 0}

    if len(filtered_months) <= 4:
        for month, amount in filtered_months.items():
            para.add_run(f'{month} : {format_currency(amount)}\n')
    else:
        # Check for consistency of amounts for the range
        unique_amounts = set(filtered_months.values())

        if len(unique_amounts) == 1:
            # If all amounts are the same
            amount = next(iter(unique_amounts))  # Get the single value
            para.add_run(f'{format_currency(amount)} /mois de Juillet {year_plus1} à Juin {year_plus2}\n')
        else:
            # Group amounts by ranges
            amount_ranges = []
            current_amount = None
            start_month = None
            prev_month = None

            for month, amount in filtered_months.items():
                # Automatically determine the year from the month
                year = month.split()[1]  # Extract year from month string

                if current_amount is None:
                    current_amount = amount
                    start_month = month
                elif abs(current_amount - amount) > 0.3:
                    amount_ranges.append((start_month, prev_month, current_amount, year))
                    current_amount = amount
                    start_month = month

                prev_month = month  # Track the previous month

            # Handle the last range
            if start_month:
                amount_ranges.append((start_month, prev_month, current_amount, year))

            for start, end, amount, year in amount_ranges:
                if start == end:
                    para.add_run(f'{format_currency(amount)} en {start}\n')
                else:
                    para.add_run(f'{format_currency(amount)} /mois de {start} à {end}\n')


def quebec_family_allowanceFR(doc, return_summary, year):
    para = doc.add_paragraph()

    total_allowance_amount = return_summary["family_allowance_amounts"]["fa_amount"]

    para.add_run(f'Vous allez recevoir un total de ').bold = False
    # Format the total allowance amount with French number formatting (thousands space, comma for decimal)
    total_run = para.add_run(format_currency(total_allowance_amount))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour ')
    para.add_run(f'l’Allocation Famille ').bold = True
    para.add_run(f'de la façon suivante :\n')
    
    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    july_amount = return_summary["family_allowance_amounts"]["july_amount"]
    october_amount = return_summary["family_allowance_amounts"]["october_amount"]
    january_amount = return_summary["family_allowance_amounts"]["january_amount"]
    april_amount = return_summary["family_allowance_amounts"]["april_amount"]

    # Format the amounts for each month if greater than 0
    if july_amount > 0:
        para.add_run(f'Juillet {year_plus1} : {format_currency(july_amount)}\n')
    if october_amount > 0:
        para.add_run(f'Octobre {year_plus1} : {format_currency(october_amount)}\n')
    if january_amount > 0:
        para.add_run(f'Janvier {year_plus2} : {format_currency(january_amount)}\n')
    if april_amount > 0:
        para.add_run(f'Avril {year_plus2} : {format_currency(april_amount)}\n')


def conclusionFR(doc, isMailQC=False):
    para = doc.add_paragraph()

    # Add the red text above the conclusion
    if isMailQC:
        red_run = para.add_run('\nNous attendons le formulaire d’autorisation signés pour soumettre vos déclarations.\n')
    else:
        red_run = para.add_run('\nNous attendons les formulaires d’autorisation signés pour soumettre votre déclaration.\n')
    red_run.font.color.rgb = RGBColor(205, 52, 78)

    # Add normal text for "Thank you."
    para.add_run('\nMerci\n')

    # Add the main conclusion text with specified formatting
    conclusion_run = para.add_run(
        '\nNous, à Sankari Inc., sommes heureux de répondre à vos demandes de renseignements fiscaux et / ou de produire vos déclarations de revenus en '
        'fonction des renseignements que vous nous fournissez. Les informations inexactes ou incomplètes fournies par vous peuvent conduire à des '
        'conseils inadéquats ou incorrects pour lesquels l\'équipe de Sankari Inc. ne peut être tenue pour responsable. Vous, le client est responsable de '
        'fournir l\'information et la documentation correcte à l\'équipe de Sankari Inc.'
    )
    # Set the font size to 8pt, color to black with 50% lighter, and italicize
    conclusion_run.font.size = Pt(8)
    conclusion_run.font.color.rgb = RGBColor(127, 127, 127)
    conclusion_run.italic = True

