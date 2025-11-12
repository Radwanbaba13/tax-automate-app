import fitz  
import os
from collections import defaultdict

from models.extractData import (
    extract_tax_summary,
    extract_gst_credit,
    extract_solidarity_credit,
    extract_child_benefit,
    extract_family_allowance,
    extract_carryforward_summary,
    extract_carbon_rebate,
    extract_ontario_trillium,
    extract_climate_action_credit
)
from models.extractDataFR import (
    extract_tax_summaryFR,
    extract_gst_creditFR,
    extract_solidarity_creditFR,
    extract_child_benefitFR,
    extract_family_allowanceFR,
    extract_carryforward_summaryFR,
    extract_carbon_rebateFR,
    extract_ontario_trilliumFR
)
from models.createWordDoc import createIndividualWordDoc, createCoupleWordDoc
from models.createWordDocMultiYear import createIndividualWordDocMultiYear


# List of titles to search for in the document
TITLES = [
    "Tax return summary",
    "GST/HST Tax Credit",
    "Solidarity Tax Credit",
    "calculation for the Canada Child Benefit (CCB)",
    "Summary of Carryforward Amounts",
    "Family allowance measure",
    "Canada carbon rebate",
    "Ontario Trillium Benefit",
    'British Columbia Climate Action Tax Credit'
]
TITLES_FR = [
    "Sommaire de la déclaration",
    "Estimation du crédit pour la TPS/TVH",
    "Estimation du calcul du crédit d'impôt pour solidarité",
    "l'allocation canadienne pour enfants",
    "Sommaire des montants reportés",
    "la mesure de l'Allocation famille",
    "remise canadienne sur le carbone",
    
]

def extract_lines_from_page(page, vertical_tolerance=1.0):
    words = page.get_text("words")
    lines = []

    words.sort(key=lambda w: (round(w[3], 1), w[0]))

    current_line = []
    last_y = None

    for word in words:
        x0, y0, x1, y1, text = word[:5]
        y_line = round(y1, 1)

        if last_y is None or abs(last_y - y_line) <= vertical_tolerance:
            current_line.append((x0, x1, text))
        else:
            if current_line:
                lines.append(current_line)
            current_line = [(x0, x1, text)]

        last_y = y_line

    if current_line:
        lines.append(current_line)

    extracted_lines = []
    for word_list in lines:
        line_text = " ".join([w[2] for w in sorted(word_list, key=lambda w: w[0])])
        extracted_lines.append(line_text.strip())

    return extracted_lines

def is_title(line_text, titles):
    for title in titles:
        if title.lower() in line_text.lower():
            return title
    return None

def prepare_summary(summary_file_path, language):
    try:
        doc = fitz.open(summary_file_path)
        all_sections = {}
        current_section = None

        # Choose titles based on language
        titles_to_use = TITLES_FR if language == 'FR' else TITLES

        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            lines = extract_lines_from_page(page)

            for i, line_text in enumerate(lines):
                next_line_text = lines[i + 1] if i + 1 < len(lines) else ""
                combined_line = line_text + " " + next_line_text

                found_title = is_title(line_text, titles_to_use) or is_title(combined_line, titles_to_use)
                if found_title:
                    current_section = found_title
                    if current_section not in all_sections:
                        all_sections[current_section] = []

                    if is_title(combined_line, titles_to_use):
                        continue

                if current_section:
                    all_sections[current_section].append(line_text)

        return {'sections': all_sections}

    except Exception as e:
        return {'error': str(e)}

def process_summaries(client_files, directory_path):
    # Initialize lists to hold summaries for couples and individuals
    coupled_summaries = []
    individual_summaries = []

    # Iterate through client files and process their summaries
    for client_file in client_files:
        # Access the summary file path directly from the client file's directory
        summary_file_path = os.path.join(client_file['summary_file_path'])
        language = client_file.get('language', 'EN')

        result = prepare_summary(summary_file_path, language)

        # Extract relevant data
        if language == 'EN':
            tax_summary = extract_tax_summary(result.get("sections", {}).get("Tax return summary", []), client_file['year'])
            province = tax_summary['province']
            gst_amounts = extract_gst_credit(result.get("sections", {}).get("GST/HST Tax Credit", []), client_file['year']) 
            solidarity_amounts = extract_solidarity_credit(result.get("sections", {}).get("Solidarity Tax Credit", []), client_file['year'])
            ccb_amounts = extract_child_benefit(result.get("sections", {}).get("calculation for the Canada Child Benefit (CCB)", []), client_file['year'])
            family_allowance_amounts = extract_family_allowance(result.get("sections", {}).get("Family allowance measure", []), client_file['year'])
            carryforward_amounts = extract_carryforward_summary(result.get("sections", {}).get("Summary of Carryforward Amounts", []), province)
            carbon_rebate_amounts = extract_carbon_rebate(result.get("sections", {}).get("Canada carbon rebate", []), client_file['year'])
            ontario_trillium_amounts = extract_ontario_trillium(result.get("sections", {}).get("Ontario Trillium Benefit", []), client_file['year'])
            climate_action_credit_amounts = extract_climate_action_credit(result.get("sections", {}).get("British Columbia Climate Action Tax Credit", []), client_file['year'])

        elif language == 'FR':
            tax_summary = extract_tax_summaryFR(result.get("sections", {}).get("Sommaire de la déclaration", []), client_file['year'])
            province = tax_summary['province']
            gst_amounts = extract_gst_creditFR(result.get("sections", {}).get("Estimation du crédit pour la TPS/TVH", []), client_file['year'])
            solidarity_amounts = extract_solidarity_creditFR(result.get("sections", {}).get("Estimation du calcul du crédit d'impôt pour solidarité", []), client_file['year'])
            ccb_amounts = extract_child_benefitFR(result.get("sections", {}).get("l'allocation canadienne pour enfants", []), client_file['year'])
            family_allowance_amounts = extract_family_allowanceFR(result.get("sections", {}).get("la mesure de l'Allocation famille", []), client_file['year'])
            carryforward_amounts = extract_carryforward_summaryFR(result.get("sections", {}).get("Sommaire des montants reportés", []), province)
            carbon_rebate_amounts = extract_carbon_rebateFR(result.get("sections", {}).get("remise canadienne sur le carbone", []), client_file['year'])
            ontario_trillium_amounts = extract_ontario_trilliumFR(result.get("sections", {}).get("Ontario Trillium Benefit", []), client_file['year'])
            climate_action_credit_amounts = extract_climate_action_credit(result.get("sections", {}).get("British Columbia Climate Action Tax Credit", []), client_file['year'])

        # Create a summary dictionary
        return_summary = {
            "tax_summary": tax_summary,
        }
        if gst_amounts and any(gst_amounts.values()):
            return_summary["gst_amounts"] = gst_amounts

        if carryforward_amounts and any(carryforward_amounts.values()):
            return_summary["carryforward_amounts"] = carryforward_amounts

        if solidarity_amounts and any(solidarity_amounts.values()):
            return_summary["solidarity_amounts"] = solidarity_amounts

        if ccb_amounts and any(ccb_amounts.values()):
            return_summary["ccb_amounts"] = ccb_amounts

        if family_allowance_amounts and any(family_allowance_amounts.values()):
            return_summary["family_allowance_amounts"] = family_allowance_amounts

        if carbon_rebate_amounts and any(carbon_rebate_amounts.values()):
            return_summary["carbon_rebate_amounts"] = carbon_rebate_amounts
        
        if ontario_trillium_amounts and any(ontario_trillium_amounts.values()):
            return_summary["ontario_trillium_amounts"] = ontario_trillium_amounts

        if climate_action_credit_amounts and any(climate_action_credit_amounts.values()):
            return_summary["climate_action_credit_amounts"] = climate_action_credit_amounts

        client_file['summary'] = return_summary

        if client_file.get('coupleWith') and client_file['coupleWith'] != 'Individual Summary':
            couple_label = client_file['coupleWith']

            partner_file = next((cf for cf in client_files if cf['label'] == couple_label), None)

            # Create a summary for the current client
            return_summary = client_file['summary']  # Assuming this contains the summary

            # Find existing couple summary or create a new one
            existing_couple = next((s for s in coupled_summaries if s['label'] == couple_label), None)

            if existing_couple:
                # Add both clients to the couple summary if not already present
                if client_file not in existing_couple['clients']:
                    existing_couple['clients'].append(client_file)
                if partner_file and partner_file not in existing_couple['clients']:
                    existing_couple['clients'].append(partner_file)

                # Add summaries for both clients
                existing_couple['summaries'].append(return_summary)
            else:
                # Create new couple summary with both client files and initialize summaries
                coupled_summaries.append({
                    'label': couple_label,
                    'clients': [client_file, partner_file] if partner_file else [client_file],
                    'summaries': [return_summary]
                })
        else:
            individual_summaries.append(client_file)

    # Group summaries by couple (ensuring single-year processing)
    couple_summaries_by_name = defaultdict(list)

    for couple in coupled_summaries:
        primary_client = next((c for c in couple['clients'] if c['isPrimary']), None)
        secondary_client = next((c for c in couple['clients'] if not c['isPrimary']), None)

        if primary_client and secondary_client:
            couple_name = f"{primary_client['summary']['tax_summary']['first_name']} {primary_client['summary']['tax_summary']['last_name']} & {secondary_client['summary']['tax_summary']['first_name']} {secondary_client['summary']['tax_summary']['last_name']}"
            year = primary_client['year']  # Ensuring single-year processing
            couple_summaries_by_name[(couple_name, year)].append(couple)  # Group by (name, year)

    # Process couples (ONLY SINGLE YEAR)
    for (couple_name, year), couples in couple_summaries_by_name.items():
        couple = couples[0]  # Take the first entry (ensuring single-year processing)
        file_prefix = "Sommaire" if couple['clients'][0]['language'] == 'FR' else "Summary"
        output_file_name = f"{file_prefix} {couple_name} {year}.docx"
        output_file_path = os.path.join(directory_path, output_file_name)
        createCoupleWordDoc(couple['clients'], output_file_path)  # Always use single-year function

    # Group summaries by individual name
    individual_summaries_by_name = defaultdict(list)

    for individual in individual_summaries:
        full_name = f"{individual['summary']['tax_summary']['first_name']} {individual['summary']['tax_summary']['last_name']}"
        individual_summaries_by_name[full_name].append(individual)

    # Process individuals (multi-year allowed)
    for full_name, summaries in individual_summaries_by_name.items():
        summaries.sort(key=lambda s: int(s['year']))  # Ensure sorting by year (converted to int)
        years = [s['year'] for s in summaries]  # Extract years for naming

        if len(summaries) > 1:  # Multi-year case
            year_str = ", ".join(map(str, years[:-1])) + f" & {years[-1]}" if len(years) > 1 else str(years[0])
            file_prefix = "Sommaire" if summaries[0]['language'] == 'FR' else "Summary"
            output_file_path = os.path.join(directory_path, f"{file_prefix} {full_name} {year_str}.docx")
            createIndividualWordDocMultiYear(summaries, output_file_path)
        else:  # Single-year case
            individual = summaries[0]
            year = individual['year']
            file_prefix = "Sommaire" if individual['language'] == 'FR' else "Summary"
            output_file_path = os.path.join(directory_path, f"{file_prefix} {full_name} {year}.docx")
            createIndividualWordDoc(individual, output_file_path)