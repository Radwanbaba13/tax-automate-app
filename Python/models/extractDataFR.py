import json
import re


def convert_to_float(value):
    # Check if value is None or empty
    if not value:
        return 0.0

    cleaned_value = value.replace(' ', '').replace(',', '')
    if len(cleaned_value) < 2:
        return 0.0

    decimal_part = cleaned_value[-2:]
    integer_part = cleaned_value[:-2]
    final_value = f"{integer_part}.{decimal_part}"

    try:
        return float(final_value)
    except ValueError:
        print(f"Error converting '{value}' to float.")
        return 0.0

def extract_value_between_labelsFR(label, next_label, line):
    """
    Extract the value in the format #### ## or # ### ## between the given label and the next_label.
    """
    # Regex to match #### ## or # ### ##
    number_pattern = r'(\d{1,3}(?:\s\d{3})*\s\d{2}|\d{1,3}\s\d{2})'

    # Check if the label is present in the line
    if label in line:
        # Extract the part of the line after the current label
        after_label = line.split(label)[-1]

        # Only split by the next label if it is not empty
        if next_label and next_label in after_label:
            after_label = after_label.split(next_label)[0]

        # Search for the number pattern in the part after the label
        match = re.search(number_pattern, after_label.strip())

        if match:
            # Return the float value by cleaning the string
            return convert_to_float(match.group(0).replace(' ', ''))

    return 0.0

def extract_tax_summaryFR(tax_summary_lines, year):
    result = {
        "first_name": None,
        "last_name": None,
        "province": None,
        "federal_refund": 0.0,
        "federal_owing": 0.0,
        "quebec_refund": 0.0,
        "quebec_owing": 0.0
    }

    for line in tax_summary_lines:
        if "Prénom" in line:
            result["first_name"] = line.split("Prénom ")[-1].strip()
        if "Nom" in line:
            result["last_name"] = line.split("Nom ")[-1].strip()
        if "Province de résidence" in line:
            result["province"] = line.split("Province de résidence ")[-1].strip()
        if "Remboursement 48400" in line:
            result["federal_refund"] = line.split("Remboursement 48400 ")[-1].strip()
        if "Solde dû 48500" in line:
            result["federal_owing"] = line.split("Solde dû 48500 ")[-1].strip()
        if "Remboursement 478" in line:
            result["quebec_refund"] = line.split("Remboursement 478 =")[-1].strip()
        if "Solde à payer 479" in line:
            result["quebec_owing"] = line.split("Solde à payer 479 =")[-1].strip()


    result["federal_refund"] = convert_to_float(result.get("federal_refund"))
    result["federal_owing"] = convert_to_float(result.get("federal_owing"))
    result["quebec_refund"] = convert_to_float(result.get("quebec_refund"))
    result["quebec_owing"] = convert_to_float(result.get("quebec_owing"))

    return result

def extract_gst_creditFR(gst_credit_lines, year):
    gst_credit_result = {
        "gst_credit_amount": 0.0,
        "july_amount": 0.0,
        "october_amount": 0.0,
        "january_amount": 0.0,
        "april_amount": 0.0
    }

    number_pattern = r'(\d{1,3}(?:\s\d{3})*\s\d{2}|\d{1,3}\s\d{2})'

    for line in gst_credit_lines:
        if "Crédit pour taxe sur les produits et services (si la ligne 24 est moins de 1 $, inscrivez zéro)." in line:
            match = re.search(number_pattern, line)
            if match:
                gst_credit_result["gst_credit_amount"] = convert_to_float(match.group(0).replace(' ', ''))
        if f"juillet {year + 1}" in line:
            gst_credit_result["july_amount"] = extract_value_between_labelsFR(f"juillet {year + 1}", f"janvier {year + 2}", line)
        if f"octobre {year + 1}" in line:
            gst_credit_result["october_amount"] = extract_value_between_labelsFR(f"octobre {year + 1}", f"avril {year + 2}", line)
        if f"janvier {year + 2}" in line:
            gst_credit_result["january_amount"] = extract_value_between_labelsFR(f"janvier {year + 2}", "", line)
        if f"avril {year + 2}" in line:
            gst_credit_result["april_amount"] = extract_value_between_labelsFR(f"avril {year + 2}", "", line)

    return gst_credit_result

def extract_ecgeb_creditFR(ecgeb_lines, year):
    ecgeb_result = {
        "ecgeb_credit_amount": 0.0,
        "july_amount": 0.0,
        "october_amount": 0.0,
        "january_amount": 0.0,
        "april_amount": 0.0
    }

    number_pattern = r'(\d{1,3}(?:\s\d{3})*\s\d{2}|\d{1,3}\s\d{2})'

    for line in ecgeb_lines:
        # if "Allocation canadienne pour l'épicerie et les besoins essentiels (0$ si la ligne 24 est moins de 1 $)." in line:
        #    match = re.search(number_pattern, line)
        #    if match:
        #        ecgeb_result["ecgeb_credit_amount"] = convert_to_float(match.group(0).replace(' ', ''))
        if f"juillet {year + 1}" in line:
            ecgeb_result["july_amount"] = extract_value_between_labelsFR(f"juillet {year + 1}", f"janvier {year + 2}", line)
        if f"octobre {year + 1}" in line:
            ecgeb_result["october_amount"] = extract_value_between_labelsFR(f"octobre {year + 1}", f"avril {year + 2}", line)
        if f"janvier {year + 2}" in line:
            ecgeb_result["january_amount"] = extract_value_between_labelsFR(f"janvier {year + 2}", "", line)
        if f"avril {year + 2}" in line:
            ecgeb_result["april_amount"] = extract_value_between_labelsFR(f"avril {year + 2}", "", line)
        ecgeb_result["ecgeb_credit_amount"] = ecgeb_result["july_amount"] + ecgeb_result["october_amount"] +ecgeb_result["january_amount"] +ecgeb_result["april_amount"]
    return ecgeb_result

def extract_carbon_rebateFR(carbon_rebate_lines, year):
    # Initialize the carbon rebate result dictionary
    carbon_rebate_result = {
        "carbon_rebate_amount": 0.0,
        "january_amount": 0.0,
        "april_amount": 0.0,
        "july_amount": 0.0,
        "october_amount": 0.0
    }

    number_pattern = r'(\d{1,3}(?:,\d{3})*\s\d{2}|\d{1,3}\s\d{2})'

    # Dynamic year calculation
    year_plus_1 = year + 1
    year_plus_2 = year + 2

    for line in carbon_rebate_lines:

        if f"avril {year_plus_1}" in line:
            carbon_rebate_result["april_amount"] = extract_value_between_labelsFR(f"avril {year_plus_1}", f"octobre {year_plus_1}", line)

        if f"juillet {year_plus_1}" in line:
            carbon_rebate_result["july_amount"] = extract_value_between_labelsFR(f"juillet {year_plus_1}", f"juillet {year_plus_1}", line)

        if f"octobre {year_plus_1}" in line:
            carbon_rebate_result["october_amount"] = extract_value_between_labelsFR(f"octobre {year_plus_1}", f"", line)

        if f"janvier {year_plus_2}" in line:
            carbon_rebate_result["january_amount"] = extract_value_between_labelsFR(f"janvier {year_plus_2}", "", line)

        carbon_rebate_result["carbon_rebate_amount"] = carbon_rebate_result["april_amount"] + carbon_rebate_result["july_amount"] + carbon_rebate_result["october_amount"] + carbon_rebate_result["january_amount"]
    return carbon_rebate_result

def extract_ontario_trilliumFR(ontario_trillium_lines, year):
    # Initialize the carbon rebate result dictionary
    ontario_trillium_result = {
        "ontario_trillium_amount": 0.0,
        "january_amount": 0.0,
        "february_amount": 0.0,
        "march_amount": 0.0,
        "april_amount": 0.0,
        "may_amount": 0.0,
        "june_amount": 0.0,
        "july_amount": 0.0,
        "august_amount": 0.0,
        "september_amount": 0.0,
        "october_amount": 0.0,
        "november_amount": 0.0,
        "december_amount": 0.0
    }

    # Dynamic year calculation
    year_plus_1 = year + 1
    year_plus_2 = year + 2

    # Iterate over all the lines and extract the rebate amounts (French month names)
    for line in ontario_trillium_lines:
        if f"Juillet {year_plus_1}" in line and f"Janvier {year_plus_2}" in line:
            ontario_trillium_result["july_amount"] = extract_value_between_labelsFR(f"Juillet {year_plus_1}", f"Janvier {year_plus_2}", line)

        if f"Août {year_plus_1}" in line and f"Février {year_plus_2}" in line:
            ontario_trillium_result["august_amount"] = extract_value_between_labelsFR(f"Août {year_plus_1}", f"Février {year_plus_2}", line)

        if f"Septembre {year_plus_1}" in line and f"Mars {year_plus_2}" in line:
            ontario_trillium_result["september_amount"] = extract_value_between_labelsFR(f"Septembre {year_plus_1}", f"Mars {year_plus_2}", line)

        if f"Octobre {year_plus_1}" in line and f"Avril {year_plus_2}" in line:
            ontario_trillium_result["october_amount"] = extract_value_between_labelsFR(f"Octobre {year_plus_1}", f"Avril {year_plus_2}", line)

        if f"Novembre {year_plus_1}" in line and f"Mai {year_plus_2}" in line:
            ontario_trillium_result["november_amount"] = extract_value_between_labelsFR(f"Novembre {year_plus_1}", f"Mai {year_plus_2}", line)

        if f"Décembre {year_plus_1}" in line and f"Juin {year_plus_2}" in line:
            ontario_trillium_result["december_amount"] = extract_value_between_labelsFR(f"Décembre {year_plus_1}", f"Juin {year_plus_2}", line)

        if f"Janvier {year_plus_2}" in line:
            ontario_trillium_result["january_amount"] = extract_value_between_labelsFR(f"Janvier {year_plus_2}", "", line)

        if f"Février {year_plus_2}" in line:
            ontario_trillium_result["february_amount"] = extract_value_between_labelsFR(f"Février {year_plus_2}", "", line)

        if f"Mars {year_plus_2}" in line:
            ontario_trillium_result["march_amount"] = extract_value_between_labelsFR(f"Mars {year_plus_2}", "", line)

        if f"Avril {year_plus_2}" in line:
            ontario_trillium_result["april_amount"] = extract_value_between_labelsFR(f"Avril {year_plus_2}", "", line)

        if f"Mai {year_plus_2}" in line:
            ontario_trillium_result["may_amount"] = extract_value_between_labelsFR(f"Mai {year_plus_2}", "", line)

        if f"Juin {year_plus_2}" in line:
            ontario_trillium_result["june_amount"] = extract_value_between_labelsFR(f"Juin {year_plus_2}", "", line)

    # Now sum the amounts to get the total carbon rebate amount
    total_rebate = sum(ontario_trillium_result[month] for month in ontario_trillium_result if month != "carbon_rebate_amount")
    ontario_trillium_result["ontario_trillium_amount"] = total_rebate

    return ontario_trillium_result



def extract_solidarity_creditFR(solidarity_lines, year):
    # Initialize the solidarity credit result dictionary
    solidarity_credit_result = {
        "solidarity_credit_amount": 0.0,
        "july_amount": 0.0,
        "august_amount": 0.0,
        "september_amount": 0.0,
        "october_amount": 0.0,
        "november_amount": 0.0,
        "december_amount": 0.0,
        "january_amount": 0.0,
        "february_amount": 0.0,
        "march_amount": 0.0,
        "april_amount": 0.0,
        "may_amount": 0.0,
        "june_amount": 0.0
    }

    for line in solidarity_lines:
        # Extract amounts for each month by checking specific months and stopping at the next month's label
        if f"Juillet {year + 1}" in line:
            solidarity_credit_result["july_amount"] = extract_value_between_labelsFR(f"Juillet {year + 1}", f"Août {year + 1}", line)
            solidarity_credit_result["august_amount"] = extract_value_between_labelsFR(f"Août {year + 1}", f"Septembre {year + 1}", line)
            solidarity_credit_result["september_amount"] = extract_value_between_labelsFR(f"Septembre {year + 1}", f"Octobre {year + 1}", line)
            solidarity_credit_result["october_amount"] = extract_value_between_labelsFR(f"Octobre {year + 1}", f"Novembre {year + 1}", line)
            solidarity_credit_result["november_amount"] = extract_value_between_labelsFR(f"Novembre {year + 1}", f"Décembre {year + 1}", line)
            solidarity_credit_result["december_amount"] = extract_value_between_labelsFR(f"Décembre {year + 1}", "", line)

        # Extract amounts for the second line (January to June)
        if f"Janvier {year + 2}" in line:
            solidarity_credit_result["january_amount"] = extract_value_between_labelsFR(f"Janvier {year + 2}", f"Février {year + 2}", line)
            solidarity_credit_result["february_amount"] = extract_value_between_labelsFR(f"Février {year + 2}", f"Mars {year + 2}", line)
            solidarity_credit_result["march_amount"] = extract_value_between_labelsFR(f"Mars {year + 2}", f"Avril {year + 2}", line)
            solidarity_credit_result["april_amount"] = extract_value_between_labelsFR(f"Avril {year + 2}", f"Mai {year + 2}", line)
            solidarity_credit_result["may_amount"] = extract_value_between_labelsFR(f"Mai {year + 2}", f"Juin {year + 2}", line)
            solidarity_credit_result["june_amount"] = extract_value_between_labelsFR(f"Juin {year + 2}", "", line)

    monthly_amounts = [
        solidarity_credit_result["july_amount"],
        solidarity_credit_result["august_amount"],
        solidarity_credit_result["september_amount"],
        solidarity_credit_result["october_amount"],
        solidarity_credit_result["november_amount"],
        solidarity_credit_result["december_amount"],
        solidarity_credit_result["january_amount"],
        solidarity_credit_result["february_amount"],
        solidarity_credit_result["march_amount"],
        solidarity_credit_result["april_amount"],
        solidarity_credit_result["may_amount"],
        solidarity_credit_result["june_amount"]
    ]

    # Sum all monthly amounts to calculate the total solidarity credit amount
    solidarity_credit_result["solidarity_credit_amount"] = sum(monthly_amounts)

    return solidarity_credit_result


import re

def parse_fa_trimestriel(line, month_label):
    """
    Extract the trimestriel (quarterly) amount from a QC Family Allowance line.
    The line ends with: ... [count cols] [trim_$] [trim_¢] [mens_$] [mens_¢]
    So trimestriel is at tokens[-4:-2] and mensuel at tokens[-2:].
    For trimestriel >= 1000, tokens[-5] is a thousands lead — validated using mensuel * 3.
    """
    after_month = line.split(month_label)[-1].strip()
    tokens = after_month.split()

    if len(tokens) < 4:
        return 0.0

    if not (re.match(r'^\d{1,3}$', tokens[-2]) and re.match(r'^\d{2}$', tokens[-1])):
        return 0.0
    mensuel = float(tokens[-2] + '.' + tokens[-1])

    if not (re.match(r'^\d{1,3}$', tokens[-4]) and re.match(r'^\d{2}$', tokens[-3])):
        return 0.0
    candidate = float(tokens[-4] + '.' + tokens[-3])

    # If tokens[-4] is exactly 3 digits, tokens[-5] might be a thousands lead (e.g. "1 596 96")
    # Use mensuel * 3 ≈ trimestriel to decide: pick whichever is closer to expected
    if re.match(r'^\d{3}$', tokens[-4]) and len(tokens) >= 5 and re.match(r'^\d{1,3}$', tokens[-5]):
        big_candidate = float(tokens[-5] + tokens[-4] + '.' + tokens[-3])
        expected = mensuel * 3
        if abs(big_candidate - expected) < abs(candidate - expected):
            return big_candidate

    return candidate


def parse_benefit_amount(line, month_label):
    """
    Extract the monetary amount (Montant column) from a benefit table line.
    The table has 3 count columns after the month label before the amount:
    (Nb personnes à charge, Nb enfants handicapés, Nb enfants en garde partagée).
    Skipping those 3 columns avoids absorbing a preceding count digit into the amount.
    """
    after_month = line.split(month_label)[-1].strip()
    tokens = after_month.split()
    if len(tokens) <= 3:
        return 0.0
    after_counts_str = ' '.join(tokens[3:])
    match = re.search(r'(\d{1,3}(?:\s\d{3})*\s\d{2})', after_counts_str)
    if match:
        return convert_to_float(match.group(1).replace(' ', ''))
    return 0.0


def extract_child_benefitFR(child_benefit_lines, year):
    result_child_benefit = {
        "ccb_amount": 0.0,
        "july_amount": 0.0,
        "august_amount": 0.0,
        "september_amount": 0.0,
        "october_amount": 0.0,
        "november_amount": 0.0,
        "december_amount": 0.0,
        "january_amount": 0.0,
        "february_amount": 0.0,
        "march_amount": 0.0,
        "april_amount": 0.0,
        "may_amount": 0.0,
        "june_amount": 0.0
    }

    # Helper to parse French-formatted amounts like "10 455 48" (no preceding count columns)
    def parse_amount_from_line(line):
        match = re.search(r'((?:\d{1,3}(?:\s\d{3})*)\s\d{2})', line)
        if match:
            raw_amount = match.group(1).replace(' ', '')
            if len(raw_amount) >= 3:
                return float(raw_amount[:-2] + '.' + raw_amount[-2:])
        return 0.0

    # Extract the overall CCB amount (no count columns on this line)
    for line in child_benefit_lines:
        if "Prestation totale = " in line:
            result_child_benefit["ccb_amount"] = parse_amount_from_line(line)
            break

    month_map = {
        f"Juillet {year + 1}": "july_amount",
        f"Août {year + 1}": "august_amount",
        f"Septembre {year + 1}": "september_amount",
        f"Octobre {year + 1}": "october_amount",
        f"Novembre {year + 1}": "november_amount",
        f"Décembre {year + 1}": "december_amount",
        f"Janvier {year + 2}": "january_amount",
        f"Février {year + 2}": "february_amount",
        f"Mars {year + 2}": "march_amount",
        f"Avril {year + 2}": "april_amount",
        f"Mai {year + 2}": "may_amount",
        f"Juin {year + 2}": "june_amount"
    }

    for line in child_benefit_lines:
        for month, key in month_map.items():
            if month in line:
                result_child_benefit[key] = parse_benefit_amount(line, month)
                break

    if result_child_benefit["ccb_amount"] == 0:
        result_child_benefit["ccb_amount"] = sum([
            result_child_benefit[key] for key in result_child_benefit if key.endswith("_amount") and key != "ccb_amount"
        ])

    return result_child_benefit


def extract_family_allowanceFR(family_allowance_lines, year):
    result_family_allowance = {
        "fa_amount": 0.0,
        "july_amount": 0.0,
        "october_amount": 0.0,
        "january_amount": 0.0,
        "april_amount": 0.0
    }

    month_map = {
        f"Juillet {year + 1}": "july_amount",
        f"Octobre {year + 1}": "october_amount",
        f"Janvier {year + 2}": "january_amount",
        f"Avril {year + 2}": "april_amount"
    }

    for line in family_allowance_lines:
        for month, key in month_map.items():
            if month in line:
                result_family_allowance[key] = parse_fa_trimestriel(line, month)

    result_family_allowance["fa_amount"] = (
        result_family_allowance["july_amount"] +
        result_family_allowance["october_amount"] +
        result_family_allowance["january_amount"] +
        result_family_allowance["april_amount"]
    )

    return result_family_allowance


def extract_carryforward_summaryFR(carryforward_lines, province):
    # Initialize the carryforward summary result dictionary
    carryforward_result = {
        "federal_tuition_amount": None,
        "quebec_tuition_20_percent": None,
        "quebec_tuition_8_percent": None
    }

    # Define regex patterns for extracting amounts
    amount_pattern = r'([\d\s]+)(?=\s*Annexe)'  # Match numbers with spaces (French format) before 'Annexe'

    for line in carryforward_lines:
        # Extract federal tuition amount
        if "Frais de scolarité et montant relatif aux études - fédéral" in line:
            match = re.search(amount_pattern, line)
            if match:
                carryforward_result["federal_tuition_amount"] = match.group(1).replace(" ", "")
            else:
                carryforward_result["federal_tuition_amount"] = 0

        # Extract Quebec tuition amounts (20%)
        if "Frais de scolarité et montant relatif aux études (20%) - Québec" in line:
            match = re.search(amount_pattern, line)
            if match:
                carryforward_result["quebec_tuition_20_percent"] = match.group(1).replace(" ", "")
            else:
                carryforward_result["quebec_tuition_20_percent"] = 0

        # Extract Quebec tuition amounts (8%)
        if "Frais de scolarité et montant relatif aux études (8%) - Québec" in line:
            match = re.search(amount_pattern, line)
            if match:
                carryforward_result["quebec_tuition_8_percent"] = match.group(1).replace(" ", "")
            else:
                carryforward_result["quebec_tuition_8_percent"] = 0

    if province != "Québec":

        if "Frais de scolarité et du montant relatif aux études" in line and "Provincial" not in line:
            match = re.search(amount_pattern, line)
            if match:
                carryforward_result["federal_tuition_amount"] = match.group(1).replace(" ", "")
            else:
                carryforward_result["federal_tuition_amount"] = 0

        carryforward_result["quebec_tuition_8_percent"] = 0
        carryforward_result["quebec_tuition_20_percent"] = 0

    return carryforward_result
