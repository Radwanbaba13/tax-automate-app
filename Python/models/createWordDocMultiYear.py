from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import locale

def createIndividualWordDocMultiYear(individual, output_file_path):
    if individual[0]['language'] == 'EN':
        createIndividualWordDocEN(individual, output_file_path)
    if individual[0]['language'] == 'FR':
        createIndividualWordDocFR(individual, output_file_path)


locale.setlocale(locale.LC_ALL, 'fr_CA.UTF-8')

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
    doc = Document()
    set_default_font(doc, "Calibri", 10)

    ind_title = individual[0]['title']

    isMailQC = any(person.get('isMailQC', False) for person in individual)
    isNewcomer = any(person.get('isNewcomer', False) for person in individual)

    summaries = {person['year']: person['summary'] for person in individual}

    years = sorted(summaries.keys(), key=int)


    # Add section_1 with formatted years
    section_1(doc, summaries[years[0]], ind_title, years, isMailQC)

    for year in years:

        return_summary = summaries[year]
        
        para = doc.add_paragraph()
        run = para.add_run(f"{year}")
        run.underline = True

        tax_return(doc, return_summary, year, years[-1])

        if "gst_amounts" in return_summary and return_summary["gst_amounts"]:
            gst_credit(doc, return_summary, isNewcomer, year, years[-1], years[0])

        if "ecgeb_amounts" in return_summary and return_summary["ecgeb_amounts"]:
            ecgeb_credit(doc, return_summary, isNewcomer, year, years[-1], years[0])

        if "solidarity_amounts" in return_summary and return_summary["solidarity_amounts"]:
            solidarity_credit(doc, return_summary, year, years[-1])

        if "ccb_amounts" in return_summary and return_summary["ccb_amounts"]:
            child_benefit(doc, return_summary, year, years[-1])

        if "family_allowance_amounts" in return_summary and return_summary["family_allowance_amounts"]:
            quebec_family_allowance(doc, return_summary, year, years[-1])

        # Only add carryforward amounts for the last year
        if year == years[-1] and "carryforward_amounts" in return_summary and return_summary["carryforward_amounts"]:
            carryforward_amounts(doc, return_summary)

    conclusion(doc, isMailQC)
    doc.save(output_file_path)


# Section 1: Title and Header
def section_1(doc, primary_summary, ind_title, years, isMailQC, couple=False, secondary_summary=None, secondary_ind_title=None):
    # Format years dynamically (e.g., "2021 & 2022" or "2021, 2022, ..., & 2024")
    if len(years) == 2:
        formatted_years = f"{years[0]} & {years[1]}"
    elif len(years) > 2:
        formatted_years = f"{', '.join(map(str, years[:-1]))}, & {years[-1]}"
    else:
        formatted_years = str(years[0])

    # Title: Centered, Dark Gray, 14pt, Calibri
    title_text = f'Summary of your {formatted_years} Tax Declarations'
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
    para.add_run('The password for the file named "COPY" is your 9-digit Social Insurance Number.\n').bold = True
    para.add_run(f'This {"set of documents" if couple else "document"} is a full copy of your tax return. ').bold = False
    para.add_run('You do not need to print it or sign it; ').bold = True
    para.add_run('please keep it for your records and review it carefully to ensure everything is accurate and complete.').bold = False

    # "Very Important" section
    very_important_run = para.add_run('\n\n** Very Important:\n')
    very_important_run.bold = True
    very_important_run.underline = True
    very_important_run.font.color.rgb = RGBColor(205, 52, 78)

    if province == "Québec":
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
            

            auth_form_count = len(years) * (2 if couple else 1)  
            para.add_run(f'Attached are {auth_form_count} Authorization Forms. Please e-sign them (or print & sign) and e-mail them back to us as soon as possible so we can EFILE your return.\n')
            para.add_run('Please sign Part F.\n\n')

            # Québec tax return
            quebec_title_run = para.add_run('Regarding your Québec tax return:\n')
            quebec_title_run.bold = True
            quebec_title_run.underline = True

            para.add_run('Please note that your Québec tax return cannot be transmitted via Efile.\n')
            qc_docs = [f'“QC {year} - {primary_first_name} {primary_last_name}.pdf”' for year in years]
            if couple and secondary_summary:
                qc_docs += [f'“QC {year} - {secondary_first_name} {secondary_last_name}.pdf”' for year in years]
            para.add_run(f'For that reason, you need to print {", ".join(qc_docs)}, sign at the bottom of page ##, and mail them to the following address:\n')

            address = para.add_run('Revenu Québec\nC. P. 2500, succursale Place-Desjardins\nMontréal (Québec) H5B 1A3\n\n')
            address.italic = True

            para.add_run('*If you would like us to mail the declaration on your behalf, please email us the signed declaration (e-signature that looks like your signature), and we will print and mail it by registered mail (with a tracking number) to QC Revenue. Please note that there will be an additional service fee of $25 plus Canada Post fees.\n')
        
        else:
            para.add_run('Please be advised that your tax returns ').bold = True
            bold_underline_run = para.add_run('have not been submitted ')
            bold_underline_run.bold = True
            bold_underline_run.underline = True
            para.add_run('to the government yet. \n').bold = True

            auth_form_count = len(years) * (4 if couple else 2) 
            para.add_run(f'Attached are {auth_form_count} Authorization Forms. Please e-sign them (or print & sign) and e-mail them back to us as soon as possible so we can EFILE your returns.\n')

            # Federal & Québec signature instructions
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
        auth_form_count = len(years) * (2 if couple else 1)
        para.add_run('Please be advised that your tax returns ').bold = True
        bold_underline_run = para.add_run('have not been submitted ')
        bold_underline_run.bold = True
        bold_underline_run.underline = True
        para.add_run('to the government yet. \n').bold = True
        para.add_run(f'Attached are {auth_form_count} Authorization Forms. Please e-sign it (or print & sign) and e-mail it back to us as soon as possible so we can EFILE your return.\n')
        para.add_run('Please sign').italic = True
        bold_part_f = para.add_run(' Part F.\n')
        bold_part_f.bold = True
        bold_part_f.italic = True



def tax_return(doc, return_summary, year, last_year, secondary_summary=None, primary_title=None, secondary_title=None, isCouple=False):
    province = return_summary["tax_summary"]["province"]

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

    if province == "Quebec":
        # Quebec Tax Return for primary individual  
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

    # Add payment section for primary individual only if this is the last year
    if year == last_year:
        add_payment_section(doc, federal_owing, quebec_owing if province == "Quebec" else 0, year, last_year)

    if isCouple and "carryforward_amounts" in return_summary and return_summary["carryforward_amounts"]:
        carryforward_amounts(doc, return_summary)

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

        # Quebec Tax Return for secondary individual
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

        # Add payment section for secondary individual only if this is the last year
        add_payment_section(doc, federal_owing, quebec_owing if province == "Quebec" else 0, year, last_year)

        if "carryforward_amounts" in secondary_summary and secondary_summary["carryforward_amounts"]:
            carryforward_amounts(doc, secondary_summary)



# Function to add the payment section
def add_payment_section(doc, federal_owing, quebec_owing, year, last_year):


    if federal_owing > 2 or quebec_owing > 2:
        para = doc.add_paragraph()
        para.add_run('You owe an amount on your ').italic = True

        if federal_owing > 2 and quebec_owing > 2:
            para.add_run('Federal and Quebec returns; ').italic = True
        elif federal_owing > 2:
            para.add_run('Federal return; ').italic = True
        elif quebec_owing > 2:
            para.add_run('Quebec return; ').italic = True

        if last_year == year:
            para.add_run(f'please make sure to pay the balance due by April 30, {int(year) + 1}, to avoid paying any interest. ').italic = True
       
        para.add_run('Please wait a few days after we E-file to pay your outstanding balance. For more details on how to pay the amount due, please click on: ').italic = True

        # Add links for payment based on owing status
        if federal_owing > 2:
            add_hyperlink(para, 'Federal', 'https://www.canada.ca/en/revenue-agency/services/payments/payments-cra.html')

        if federal_owing > 2 and quebec_owing > 2:
            para.add_run(' and ')
        if quebec_owing > 2:
            add_hyperlink(para, 'Quebec', 'https://www.revenuquebec.ca/en/citizens/income-tax-return/paying-a-balance-due-or-receiving-a-refund/income-tax-balance-due/')


# Section: Solidarity Credit
def solidarity_credit(doc, return_summary, year, last_year):
    para = doc.add_paragraph()
    # Add title directly with bold and underline
    title_run = para.add_run('Solidarity Credits:\n')
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
    para.add_run(f'Solidarity tax credit').bold = True
    if year == last_year:
        para.add_run(f' as follows:\n')
    else:
        para.add_run(f'.\n')

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

    if year == last_year:
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
def gst_credit(doc, return_summary, isNewcomer, year, last_year, first_year):
    para = doc.add_paragraph()
    title_run = para.add_run('GST')
    title_run.bold = True
    title_run.underline = True

    if isNewcomer and year == first_year:
        title_run = para.add_run('* ')
        title_run.bold = True
        title_run.underline = True
    title_run = para.add_run(' Credits:\n')
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
    para.add_run(f'GST/ HST credit').bold = True
    if year == last_year:
        para.add_run(f' as follows:\n')
    else:
        para.add_run(f'.\n')

    if year == last_year:
        if july_amount > 0:
            para.add_run(f'July {year}: ${july_amount:,.2f}\n')
        if october_amount > 0:
            para.add_run(f'October {year}: ${october_amount:,.2f}\n')
        if january_amount > 0:
            para.add_run(f'January {year + 1}: ${january_amount:,.2f}\n')
        if april_amount > 0:
            para.add_run(f'April {year + 1}: ${april_amount:,.2f}\n')

    if isNewcomer and year == first_year:
        para.add_run(
            '\n*Note that you will receive a letter from Canada Revenue Agency asking you to provide your income before arrival to Canada (so from January 1st until the date of arrival). '
            'Even though it was mentioned on the declaration, you still need to respond to the letter and provide the amount. If you do not reply, they will not pay the GST amount.\n'
        ).italic = True

    
# Section: ECGEB Credit
def ecgeb_credit(doc, return_summary, isNewcomer, year, last_year, first_year):
    para = doc.add_paragraph()
    title_run = para.add_run('ECGEB')
    title_run.bold = True
    title_run.underline = True

    if isNewcomer and year == first_year:
        title_run = para.add_run('* ')
        title_run.bold = True
        title_run.underline = True
    title_run = para.add_run(' Credits:\n')
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
    para.add_run(f'Canada Groceries and Essentials Benefit (ECGEB)').bold = True
    if year == last_year:
        para.add_run(f' as follows:\n')
    else:
        para.add_run(f'.\n')

    if year == last_year:
        if july_amount > 0:
            para.add_run(f'July {year}: ${july_amount:,.2f}\n')
        if october_amount > 0:
            para.add_run(f'October {year}: ${october_amount:,.2f}\n')
        if january_amount > 0:
            para.add_run(f'January {year + 1}: ${january_amount:,.2f}\n')
        if april_amount > 0:
            para.add_run(f'April {year + 1}: ${april_amount:,.2f}\n')

    if isNewcomer and year == first_year:
        para.add_run(
            '\n*Note that you will receive a letter from Canada Revenue Agency asking you to provide your income before arrival to Canada (so from January 1st until the date of arrival). '
            'Even though it was mentioned on the declaration, you still need to respond to the letter and provide the amount. If you do not reply, they will not pay the ECGEB amount.\n'
        ).italic = True


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
    if quebec_tuition_8_percent > 0:
        para.add_run('\nQC (eligible to 8%): $')
        para.add_run(f"{quebec_tuition_8_percent:,}")

    para.add_run(
        '\n\nThose accumulated tuition fees are tax credits that you will be using in future tax declarations when you work '
        'and pay tax on your income.'
    ).italic = True



# Section: Child Benefit Amount
def child_benefit(doc, return_summary, year, last_year):
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
    if year == last_year:
        para.add_run(f' as follows:\n')
    else:
        para.add_run(f'.\n')

    # Filter out months with a zero amount
    filtered_months = {month: amount for month, amount in amounts.items() if amount > 0}

    if year == last_year:
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

                for month, amount in filtered_months.items():
                    # Automatically determine the year from month
                    year = month.split()[1]  # Extract year from month string

                    if current_amount is None:
                        current_amount = amount
                        start_month = month
                    elif abs(current_amount - amount) > 0.3:
                        amount_ranges.append((start_month, month, current_amount, year))
                        current_amount = amount
                        start_month = month

                # Handle the last range
                if start_month:
                    amount_ranges.append((start_month, month, current_amount, year))

                for start, end, amount, year in amount_ranges:
                    para.add_run(f'${amount:,.2f}/month from {start} to {end}')

# Section: Quebec Family Allowance
def quebec_family_allowance(doc, return_summary, year, last_year):
    para = doc.add_paragraph()

    total_allowance_amount = return_summary["family_allowance_amounts"]["fa_amount"]

    para.add_run(f'You will receive a total of ').bold = False
    total_run = para.add_run(f"${total_allowance_amount:,.2f}")
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' for the ')
    para.add_run(f'Quebec Family Allowance').bold = True
    if year == last_year:
        para.add_run(f' as follows:\n')
    else:
        para.add_run(f'.\n')

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    july_amount = return_summary["family_allowance_amounts"]["july_amount"]
    october_amount = return_summary["family_allowance_amounts"]["october_amount"]
    january_amount = return_summary["family_allowance_amounts"]["january_amount"]
    april_amount = return_summary["family_allowance_amounts"]["april_amount"]

    if year == last_year:
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
    doc = Document()
    set_default_font(doc, "Calibri", 10)

    ind_title = individual[0]['title']
    if ind_title == 'Mr':
        ind_title = "M."
    elif ind_title in ['Ms', 'Mrs']:
        ind_title = "Mme"

    isMailQC = any(person.get('isMailQC', False) for person in individual)
    isNewcomer = any(person.get('isNewcomer', False) for person in individual)

    summaries = {person['year']: person['summary'] for person in individual}
    years = sorted(summaries.keys(), key=int)

    # Add section_1FR with formatted years
    section_1FR(doc, summaries[years[0]], ind_title, years, isMailQC)

    for year in years:
        return_summary = summaries[year]

        para = doc.add_paragraph()
        run = para.add_run(f"{year}")
        run.underline = True

        tax_returnFR(doc, return_summary, year, years[-1])

        if "gst_amounts" in return_summary and return_summary["gst_amounts"]:
            gst_creditFR(doc, return_summary, isNewcomer, year, years[-1], years[0])

        if "ecgeb_amounts" in return_summary and return_summary["ecgeb_amounts"]:
            ecgeb_creditFR(doc, return_summary, isNewcomer, year, years[-1], years[0])

        if "solidarity_amounts" in return_summary and return_summary["solidarity_amounts"]:
            solidarity_creditFR(doc, return_summary, year, years[-1])

        if "ccb_amounts" in return_summary and return_summary["ccb_amounts"]:
            child_benefitFR(doc, return_summary, year, years[-1])

        if "family_allowance_amounts" in return_summary and return_summary["family_allowance_amounts"]:
            quebec_family_allowanceFR(doc, return_summary, year, years[-1])

        if year == years[-1] and "carryforward_amounts" in return_summary and return_summary["carryforward_amounts"]:
            carryforward_amountsFR(doc, return_summary)

    conclusionFR(doc)
    doc.save(output_file_path)


def section_1FR(doc, return_summary, ind_title, years, isMailQC, couple=False, secondary_summary=None, secondary_ind_title=None):
    # Format years dynamically
    if len(years) == 2:
        formatted_years = f"{years[0]} & {years[1]}"
    elif len(years) > 2:
        formatted_years = f"{', '.join(map(str, years[:-1]))}, & {years[-1]}"
    else:
        formatted_years = str(years[0])

    # Title: Centered, Dark Gray, 14pt, Calibri
    title_text = f"Sommaire de {'vos' if couple else 'votre'} déclarations d’impôts {formatted_years}"
    title = doc.add_paragraph(title_text)
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
    if couple and secondary_summary and secondary_ind_title:
        secondary_first_name = secondary_summary["tax_summary"]["first_name"]
        secondary_last_name = secondary_summary["tax_summary"]["last_name"]
        para.add_run(f" & {secondary_ind_title} {secondary_last_name}")

    # Introduction paragraph
    para = doc.add_paragraph()
    para.add_run(f'Nous avons joint à ce courriel tous les documents de {'vos déclarations' if couple else 'votre déclaration'} d’impôts {year}. ').bold = False
    para.add_run('Le mot de passe du document nommé "COPIE" est composé des neuf chiffres de votre numéro d’assurance sociale.\n').bold = True
    if couple:
        para.add_run('Ce jeu de documents constitue une copie complète de vos déclarations de revenus. ').bold = False
        para.add_run('Vous n\'avez pas besoin de les imprimer ou de les signer; ').bold = True
        para.add_run('vous avez juste besoin de les retenir pour votre dossier. Veuillez revoir les déclarations de revenu attentivement afin de vous assurer qu’elles sont exactes et complètes.\n').bold = False

    else:    
        para.add_run('Ce document constitue une copie complète de votre déclaration de revenus. ').bold = False
        para.add_run('Vous n\'avez pas besoin de l’imprimer ou de le signer; ').bold = True
        para.add_run('vous avez juste besoin de le retenir pour votre dossier. Veuillez revoir la déclaration de revenu attentivement afin de vous assurer qu’elle est exacte et complète.').bold = False

    # "Very Important" section
    very_important_run = para.add_run('\n\n** TRÈS IMPORTANT :\n')
    very_important_run.bold = True
    very_important_run.underline = True
    very_important_run.font.color.rgb = RGBColor(205, 52, 78)

    if province == "Québec":
        if isMailQC:
            # Special message if isMailQC is True
            federal_title_run = para.add_run('Déclaration Fédérale :\n')
            federal_title_run.bold = True
            federal_title_run.underline = True
            para.add_run('Veuillez noter que votre déclaration fédérale ').bold = True
            federal_advisory_run = para.add_run('n’a pas encore été soumise ')
            federal_advisory_run.bold = True
            federal_advisory_run.underline = True
            para.add_run('au gouvernement.\n').bold = True

            auth_form_count = len(years) * (2 if couple else 1)
            para.add_run(f'Vous trouverez ci-joint {auth_form_count} formulaire(s) d’autorisation. Veuillez les signer électroniquement (ou les imprimer et signer) et nous les envoyer par courriel dès que possible afin que nous puissions transmettre votre déclaration par EFILE.\n')
            para.add_run('S’il vous plaît signer la partie F.\n\n')
            
            qc_docs = [f'“QC {year} - {first_name} {last_name}.pdf”' for year in years]

            # Québec tax return
            quebec_title_run = para.add_run('Déclaration Provinciale :\n')
            quebec_title_run.bold = True
            quebec_title_run.underline = True

            para.add_run('Veuillez noter que votre déclaration provinciale ne peut pas être transmise via Efile.\n')
            if couple and secondary_summary:
                qc_docs += [f'“QC {year} - {secondary_first_name} {secondary_last_name}.pdf”' for year in years]
            para.add_run(f'Vous devez également imprimer {", ".join(qc_docs)}, signer en bas de la page ##, et l’envoyer par la poste à l’adresse suivante :\n')

            address = para.add_run('Revenu Québec\nC. P. 2500, succursale Place-Desjardins\nMontréal (Québec) H5B 1A3\n\n')
            address.italic = True

            para.add_run('*Si vous souhaitez que nous envoyions la déclaration pour vous, veuillez nous envoyer la déclaration signée (signature électronique ressemblant à votre signature), et nous l’imprimerons et l’enverrons par courrier recommandé avec un numéro de suivi à Revenu Québec. Des frais de service de 25 $ plus les frais de Postes Canada s’appliquent.\n')

        else:
            para.add_run('Veuillez noter que votre déclaration d’impôt ').bold = True
            bold_underline_run = para.add_run('n’a pas encore été soumise ')
            bold_underline_run.bold = True
            bold_underline_run.underline = True
            para.add_run('au gouvernement.\n').bold = True

            auth_form_count = len(years) * (4 if couple else 2)
            para.add_run(f'Vous trouverez ci-joint {auth_form_count} formulaire(s) d’autorisation. Veuillez les signer électroniquement (ou les imprimer et signer) et nous les envoyer par courriel dès que possible afin que nous puissions transmettre votre déclaration par EFILE.\n')

            para.add_run('Pour le formulaire fédéral, veuillez signer ').italic = True
            bold_part_f = para.add_run('la partie F.')
            bold_part_f.bold = True
            bold_part_f.italic = True
            para.add_run('\nPour le formulaire du Québec, veuillez signer à la fin de ').italic = True
            bold_section_4 = para.add_run('la section 4.')
            bold_section_4.bold = True
            bold_section_4.italic = True
    else:
        auth_form_count = len(years) * (2 if couple else 1)
        # Original message if isMailQC is False
        para.add_run('Noter que votre déclaration d’impôt ').bold = True
        bold_underline_run = para.add_run('n’a pas encore été soumise ')
        bold_underline_run.bold = True
        bold_underline_run.underline = True
        para.add_run('au gouvernement via EFile.\n').bold = True
        para.add_run(f'Vous trouverez ci-joint {auth_form_count} formulaires d’autorisation. Veuillez les signer électroniquement (ou imprimer/signer) et nous les envoyer par courriel le plus tôt possible afin que nous puissions transmettre votre déclaration par EFILE.\n')
        para.add_run('Veuillez signer ').italic = True
        bold_part_f = para.add_run('la partie F.')
        bold_part_f.bold = True
        bold_part_f.italic = True

def tax_returnFR(doc, return_summary, year, last_year, secondary_summary=None, primary_title=None, secondary_title=None, isCouple=False):
    province = return_summary["tax_summary"]["province"]

    para = doc.add_paragraph()

    # Title "RÉSULTATS" in bold red
    bold_red_results = para.add_run('RÉSULTATS\n')
    bold_red_results.bold = True
    bold_red_results.font.color.rgb = RGBColor(205, 52, 78)

    # Helper function to format numbers in the French style
    def format_french_number(amount):
        return f"{amount:,.2f}".replace(",", " ").replace(".", ",")
    
        # Function to handle payment section if amounts are owed
    def add_payment_section(para, federal_owing, quebec_owing, year, last_year):
        if federal_owing > 0 or quebec_owing > 0:
            para = doc.add_paragraph()
            para.add_run('Vous devez un montant à votre ').italic = True

            if federal_owing > 0 and quebec_owing > 0:
                para.add_run('déclaration fédérale et provinciale; ').italic = True
            elif federal_owing > 0:
                para.add_run('déclaration fédérale; ').italic = True
            elif quebec_owing > 0:
                para.add_run('déclaration provinciale; ').italic = True
            if last_year == year:
                para.add_run(f'assurez-vous de payer le solde dû avant le 30 avril {int(year) + 1} pour éviter de payer des intérêts. ')
            para.add_run('Veuillez attendre quelques jours après la transmission Efile pour payer votre solde dû. ')
            para.add_run('Pour plus de détails sur la façon de payer le montant dû, veuillez cliquer sur : ')

            # Add hyperlinks for payment details
            if federal_owing > 0:
                add_hyperlink(para, 'Fédéral', 'https://www.canada.ca/fr/agence-revenu/services/paiements/paiements-arc.html')
            if federal_owing > 0 and quebec_owing > 0:
                para.add_run(' et ')
            if quebec_owing > 0:
                add_hyperlink(para, 'Québec', 'https://www.revenuquebec.ca/fr/citoyens/declaration-de-revenus/payer-ou-etre-rembourse/solde-dimpot-a-payer/')


    # Process primary individual's tax details
    if isCouple:
        para.add_run(f"\n{primary_title} {return_summary['tax_summary']['last_name']}\n")

    # Federal Tax Return for primary individual
    para.add_run('Déclaration Fédérale\n').bold = True
    federal_refund = return_summary["tax_summary"]["federal_refund"]
    federal_owing = return_summary["tax_summary"]["federal_owing"]

    if federal_refund > 0:
        para.add_run("Vous avez droit à un remboursement de ").bold = False
        refund_run = para.add_run(f"{format_french_number(federal_refund)} $ \n")
        refund_run.bold = True
        refund_run.font.color.rgb = RGBColor(0, 128, 0)
    elif federal_owing > 0:
        para.add_run("Vous devez un montant de ").bold = False
        owing_run = para.add_run(f"{format_french_number(federal_owing)} $ \n")
        owing_run.bold = True
        owing_run.font.color.rgb = RGBColor(255, 0, 0)
    else:
        para.add_run("Vous n'avez ni remboursement ni solde dû.\n")

    if province == "Québec":
        # Quebec Tax Return for primary individual
        para.add_run('Déclaration Provinciale\n').bold = True
        quebec_refund = return_summary["tax_summary"]["quebec_refund"]
        quebec_owing = return_summary["tax_summary"]["quebec_owing"]

        if quebec_refund > 0:
            para.add_run("Vous avez droit à un remboursement de ").bold = False
            refund_run = para.add_run(f"{format_french_number(quebec_refund)} $ \n")
            refund_run.bold = True
            refund_run.font.color.rgb = RGBColor(0, 128, 0)
        elif quebec_owing > 0:
            para.add_run("Vous devez un montant de ").bold = False
            owing_run = para.add_run(f"{format_french_number(quebec_owing)} $ \n")
            owing_run.bold = True
            owing_run.font.color.rgb = RGBColor(255, 0, 0)
        else:
            para.add_run("Vous n'avez ni remboursement ni solde dû.\n")

    # Add payment section for primary individual if this is the last year
    if year == last_year:
        add_payment_section(doc, federal_owing, quebec_owing if province == "Québec" else 0, year, last_year)

    if isCouple and "carryforward_amounts" in return_summary and return_summary["carryforward_amounts"]:
        carryforward_amounts(doc, return_summary)

    # Process secondary individual if applicable
    if isCouple and secondary_summary:
        para.add_run(f"\n{secondary_title} {secondary_summary['tax_summary']['last_name']}\n")

        # Federal Tax Return for secondary individual
        para.add_run('Déclaration Fédérale\n').bold = True
        federal_refund = secondary_summary["tax_summary"]["federal_refund"]
        federal_owing = secondary_summary["tax_summary"]["federal_owing"]

        if federal_refund > 0:
            para.add_run("Vous avez droit à un remboursement de ").bold = False
            refund_run = para.add_run(f"{format_french_number(federal_refund)} $ \n")
            refund_run.bold = True
            refund_run.font.color.rgb = RGBColor(0, 128, 0)
        elif federal_owing > 0:
            para.add_run("Vous devez un montant de ").bold = False
            owing_run = para.add_run(f"{format_french_number(federal_owing)} $ \n")
            owing_run.bold = True
            owing_run.font.color.rgb = RGBColor(255, 0, 0)
        else:
            para.add_run("Vous n'avez ni remboursement ni solde dû.\n")

    if province == "Québec":
        # Quebec Tax Return for secondary individual
        para.add_run('Déclaration Provinciale\n').bold = True
        quebec_refund = secondary_summary["tax_summary"]["quebec_refund"]
        quebec_owing = secondary_summary["tax_summary"]["quebec_owing"]

        if quebec_refund > 0:
            para.add_run("Vous avez droit à un remboursement de ").bold = False
            refund_run = para.add_run(f"{format_french_number(quebec_refund)} $ \n")
            refund_run.bold = True
            refund_run.font.color.rgb = RGBColor(0, 128, 0)
        elif quebec_owing > 0:
            para.add_run("Vous devez un montant de ").bold = False
            owing_run = para.add_run(f"{format_french_number(quebec_owing)} $ \n")
            owing_run.bold = True
            owing_run.font.color.rgb = RGBColor(255, 0, 0)
        else:
            para.add_run("Vous n'avez ni remboursement ni solde dû.\n")

        # Add payment section for secondary individual if this is the last year
        add_payment_section(doc, federal_owing, quebec_owing if province == "Québec" else 0, year, last_year)

        if "carryforward_amounts" in secondary_summary and secondary_summary["carryforward_amounts"]:
            carryforward_amounts(doc, secondary_summary)


# Section: Crédit de solidarité
def solidarity_creditFR(doc, return_summary, year, last_year):
    para = doc.add_paragraph()

    # Add title with bold and underline
    title_run = para.add_run('Crédit de solidarité:\n')
    title_run.bold = True
    title_run.underline = True

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    # Extract the total solidarity credit amount
    solidarity_amount = return_summary["solidarity_amounts"]["solidarity_credit_amount"]

    # Add the formatted total amount to the paragraph
    para.add_run(f'Vous allez recevoir un total de ')
    total_run = para.add_run(format_currency(solidarity_amount))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour le ')
    para.add_run(f'Crédit de solidarité').bold = True

    if year == last_year:
        para.add_run(f' de la façon suivante :\n')
    else:
        para.add_run(f'.\n')

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

    if year == last_year:
        if len(filtered_months) <= 4:
            for month, amount in filtered_months.items():
                year = year_plus1 if month in ["Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"] else year_plus2
                para.add_run(f'{month} {year} : {format_currency(amount)}\n')
        else:
            unique_amounts = set(filtered_months.values())

            if len(unique_amounts) == 1:
                amount = next(iter(unique_amounts))
                para.add_run(f'{format_currency(amount)} /mois de Juillet {year_plus1} à Juin {year_plus2}\n')
            else:
                amount_ranges = []
                current_amount = None
                start_month = None

                for month, amount in filtered_months.items():
                    year = year_plus1 if month in ["Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"] else year_plus2
                    if current_amount is None:
                        current_amount = amount
                        start_month = month
                    elif abs(current_amount - amount) > 0.3:
                        end_year = year_plus1 if start_month in ["Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"] else year_plus2
                        amount_ranges.append((start_month, month, current_amount, end_year))
                        current_amount = amount
                        start_month = month
                    if month == "Juin":
                        end_year = year_plus2
                        amount_ranges.append((start_month, month, current_amount, end_year))

                for start, end, amount, end_year in amount_ranges:
                    para.add_run(f'{format_currency(amount)} /mois de {start} {year_plus1} à {end} {end_year}\n')


# Section: Crédits ACEBE
def ecgeb_creditFR(doc, return_summary, isNewcomer, year, last_year, first_year):
    para = doc.add_paragraph()
    title_run = para.add_run('Crédits ACEBE')
    title_run.bold = True
    title_run.underline = True

    if isNewcomer and year == first_year:
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

    para.add_run(f'Vous allez recevoir un total de ')
    total_run = para.add_run(format_currency(ecgeb_credit_amount))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour la ')
    para.add_run(f'Allocation canadienne pour l\'épicerie et les besoins essentiels (ACEBE)').bold = True

    if year == last_year:
        para.add_run(f' de la façon suivante :\n')
    else:
        para.add_run(f'.\n')

    if year == last_year:
        if july_amount > 0:
            para.add_run(f'Juillet {year} : {format_currency(july_amount)}\n')
        if october_amount > 0:
            para.add_run(f'Octobre {year} : {format_currency(october_amount)}\n')
        if january_amount > 0:
            para.add_run(f'Janvier {year + 1} : {format_currency(january_amount)}\n')
        if april_amount > 0:
            para.add_run(f'Avril {year + 1} : {format_currency(april_amount)}\n')

    if isNewcomer and year == first_year:
        para.add_run(
            '\n*Notez que vous allez recevoir une lettre de l\'Agence du Revenu du Canada vous demandant de fournir vos revenus avant votre arrivée au Canada (du 1er janvier jusqu\'à la date d\'arrivée). '
            'Même si cela a été mentionné sur la déclaration, vous devez quand même répondre à la lettre. Si vous ne répondez pas, ils ne paieront pas le montant de la ACEBE.\n'
        ).italic = True


# Section: Crédit TPS
def gst_creditFR(doc, return_summary, isNewcomer, year, last_year, first_year):
    para = doc.add_paragraph()
    title_run = para.add_run('Crédits TPS')
    title_run.bold = True
    title_run.underline = True

    if isNewcomer and year == first_year:
        title_run = para.add_run('* ')
        title_run.bold = True
        title_run.underline = True
    title_run = para.add_run(' :\n')
    title_run.bold = True
    title_run.underline = True

    gst_credit_amount = return_summary["gst_amounts"]["gst_credit_amount"]
    july_amount = return_summary["gst_amounts"].get("july_amount", 0)
    october_amount = return_summary["gst_amounts"].get("october_amount", 0)
    january_amount = return_summary["gst_amounts"].get("january_amount", 0)
    april_amount = return_summary["gst_amounts"].get("april_amount", 0)

    para.add_run(f'Vous allez recevoir un total de ')
    total_run = para.add_run(format_currency(gst_credit_amount))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour les crédits ')
    para.add_run(f'TPS').bold = True

    if year == last_year:
        para.add_run(f' de la façon suivante :\n')
    else:
        para.add_run(f'.\n')

    if year == last_year:
        if july_amount > 0:
            para.add_run(f'Juillet {year} : {format_currency(july_amount)}\n')
        if october_amount > 0:
            para.add_run(f'Octobre {year} : {format_currency(october_amount)}\n')
        if january_amount > 0:
            para.add_run(f'Janvier {year + 1} : {format_currency(january_amount)}\n')
        if april_amount > 0:
            para.add_run(f'Avril {year + 1} : {format_currency(april_amount)}\n')

    if isNewcomer and year == first_year:
        para.add_run(
            '\n*Notez que vous allez recevoir une lettre de l\'Agence du Revenu du Canada vous demandant de fournir vos revenus avant votre arrivée au Canada (du 1er janvier jusqu\'à la date d\'arrivée). '
            'Même si cela a été mentionné sur la déclaration, vous devez quand même répondre à la lettre. Si vous ne répondez pas, ils ne paieront pas le montant de la TPS.\n'
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
    if quebec_tuition_8_percent > 0:
        para.add_run('\nQC (admissible à 8%) : ')
        para.add_run(f"{formatted_quebec_amount} $")

    # Add additional explanatory text
    para.add_run(
        '\n\nCes frais de scolarité accumulés sont des crédits d\'impôt que vous allez utiliser dans vos futures déclarations, lorsque vous générez un revenu et payez des impôts.'
    ).italic = True




# Section: Prestations pour Enfants
def child_benefitFR(doc, return_summary, year, last_year):
    para = doc.add_paragraph()
    # Add title directly with bold and underline
    title_run = para.add_run('Prestations pour Enfants:\n')
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

    # Display total benefit amount
    para.add_run(f'Vous allez recevoir un total de ').bold = False
    total_run = para.add_run(format_currency(total_ccb))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour ')
    para.add_run(f'l’Allocation canadienne pour enfants ').bold = True
    if year == last_year:
        para.add_run(f' de la façon suivante :\n')
    else:
        para.add_run(f'.\n')

    # Filter out months with zero amounts
    filtered_months = {month: amount for month, amount in amounts.items() if amount > 0}

    if year == last_year:
        if len(filtered_months) <= 4:
            for month, amount in filtered_months.items():
                para.add_run(f'{month} : {format_currency(amount)}\n')
        else:
            # Check for consistency of amounts for the range
            unique_amounts = set(filtered_months.values())

            if len(unique_amounts) == 1:
                # If all amounts are the same
                amount = next(iter(unique_amounts))  # Get the single value
                para.add_run(f'{format_currency(amount)} /mois de Juillet {year_plus1} à Juin {year_plus2}')
            else:
                # Group amounts by ranges
                amount_ranges = []
                current_amount = None
                start_month = None

                for month, amount in filtered_months.items():
                    # Automatically determine the year from the month
                    year = month.split()[1]  # Extract year from month string

                    if current_amount is None:
                        current_amount = amount
                        start_month = month
                    elif abs(current_amount - amount) > 0.3:
                        amount_ranges.append((start_month, month, current_amount, year))
                        current_amount = amount
                        start_month = month

                # Handle the last range
                if start_month:
                    amount_ranges.append((start_month, month, current_amount, year))

                for start, end, amount, year in amount_ranges:
                    para.add_run(f'{format_currency(amount)} /mois de {start} à {end}')


# Section: Allocation Famille (Québec)
def quebec_family_allowanceFR(doc, return_summary, year, last_year):
    para = doc.add_paragraph()

    total_allowance_amount = return_summary["family_allowance_amounts"]["fa_amount"]

    para.add_run(f'Vous allez recevoir un total de ').bold = False
    total_run = para.add_run(format_currency(total_allowance_amount))
    total_run.bold = True
    total_run.font.color.rgb = RGBColor(0, 128, 0)
    para.add_run(f' pour ')
    para.add_run(f'l’Allocation Famille').bold = True
    if year == last_year:
        para.add_run(f' de la façon suivante :\n')
    else:
        para.add_run(f'.\n')

    year_plus1 = int(year) + 1
    year_plus2 = int(year) + 2

    july_amount = return_summary["family_allowance_amounts"]["july_amount"]
    october_amount = return_summary["family_allowance_amounts"]["october_amount"]
    january_amount = return_summary["family_allowance_amounts"]["january_amount"]
    april_amount = return_summary["family_allowance_amounts"]["april_amount"]

    if year == last_year:
        if july_amount > 0:
            para.add_run(f'Juillet {year_plus1} : {format_currency(july_amount)}\n')
        if october_amount > 0:
            para.add_run(f'Octobre {year_plus1} : {format_currency(october_amount)}\n')
        if january_amount > 0:
            para.add_run(f'Janvier {year_plus2} : {format_currency(january_amount)}\n')
        if april_amount > 0:
            para.add_run(f'Avril {year_plus2} : {format_currency(april_amount)}\n')


def conclusionFR(doc, isCouple=False):
    para = doc.add_paragraph()

    # Add the red text above the conclusion
    if isCouple:
        red_run = para.add_run('\nNous attendons les formulaires d’autorisations signés pour soumettre vos déclarations.\n')
    else:
        red_run = para.add_run('\nNous attendons les formulaire d’autorisations signé pour soumettre votre déclaration.\n')
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

