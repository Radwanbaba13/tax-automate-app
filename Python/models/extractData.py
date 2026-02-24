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

def extract_value_between_labels(label, next_label, line):
    """
    Extract the value in the format #### ## or #,### ## between the given label and the next_label.
    """
# Regex to match #### ## or #,### ## (our expected number format)
    number_pattern = r'(\d{1,3}(?:,\d{3})*\s\d{2})'

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
            return convert_to_float(match.group(0).replace(',', '').replace(' ', ''))

    return 0.0



def extract_tax_summary(tax_summary_lines, year):
    # Initialize the result dictionary
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
        # Extract first name
        if "First name" in line:
            result["first_name"] = line.split("First name ")[-1].strip()

        # Extract last name
        if "Last name" in line:
            result["last_name"] = line.split("Last name ")[-1].strip()

        # Extract province
        if "Province of residence" in line:
            result["province"] = line.split("Province of residence ")[-1].strip()

        # Extract federal refund
        if "Refund 48400" in line:
            result["federal_refund"] = line.split("Refund 48400 ")[-1].strip()

        # Extract federal owing
        if "Balance owing 48500" in line:
            result["federal_owing"] = line.split("Balance owing 48500 ")[-1].strip()

        # Extract Quebec refund
        if "Refund 478" in line:
            result["quebec_refund"] = line.split("Refund 478 = ")[-1].strip()

        # Extract Quebec owing
        if "Balance due 479" in line:
            result["quebec_owing"] = line.split("Balance due 479 = ")[-1].strip()

    # Process numerical values for federal and Quebec owing/refund
    result["federal_refund"] = convert_to_float(result.get("federal_refund"))
    result["federal_owing"] = convert_to_float(result.get("federal_owing"))
    result["quebec_refund"] = convert_to_float(result.get("quebec_refund"))
    result["quebec_owing"] = convert_to_float(result.get("quebec_owing"))

    return result

def extract_gst_credit(gst_credit_lines, year):
    # Initialize the GST credit result dictionary
    gst_credit_result = {
        "gst_credit_amount": 0.0,
        "july_amount": 0.0,
        "october_amount": 0.0,
        "january_amount": 0.0,
        "april_amount": 0.0
    }

    number_pattern = r'(\d{1,3}(?:,\d{3})*\s\d{2}|\d{1,3}\s\d{2})'

    # Dynamic year calculation
    year_plus_1 = year + 1
    year_plus_2 = year + 2

    for line in gst_credit_lines:
        # Extract GST credit total amount
        if "Goods and Services Tax Credit (if line 24 is less than $1, enter zero)." in line:
            match = re.search(number_pattern, line)
            if match:
                gst_credit_result["gst_credit_amount"] = convert_to_float(match.group(0).replace(',', '').replace(' ', ''))

        if f"July {year_plus_1}" in line:
            gst_credit_result["july_amount"] = extract_value_between_labels(f"July {year_plus_1}", f"January {year_plus_2}", line)

        if f"October {year_plus_1}" in line:
            gst_credit_result["october_amount"] = extract_value_between_labels(f"October {year_plus_1}", f"April {year_plus_2}", line)

        if f"January {year_plus_2}" in line:
            gst_credit_result["january_amount"] = extract_value_between_labels(f"January {year_plus_2}", "", line)

        if f"April {year_plus_2}" in line:
            gst_credit_result["april_amount"] = extract_value_between_labels(f"April {year_plus_2}", "", line)

    return gst_credit_result

def extract_ecgeb_credit(ecgeb_lines, year):
    # Initialize the ECGEB credit result dictionary
    ecgeb_result = {
        "ecgeb_credit_amount": 0.0,
        "july_amount": 0.0,
        "october_amount": 0.0,
        "january_amount": 0.0,
        "april_amount": 0.0
    }

    number_pattern = r'(\d{1,3}(?:,\d{3})*\s\d{2}|\d{1,3}\s\d{2})'

    year_plus_1 = year + 1
    year_plus_2 = year + 2

    for line in ecgeb_lines:
        if "Canada Groceries and Essentials Benefit (if line 24 is less than $1, enter zero)." in line:
            match = re.search(number_pattern, line)

            if match:
                ecgeb_result["ecgeb_credit_amount"] = convert_to_float(match.group(0).replace(',', '').replace(' ', ''))

        if f"July {year_plus_1}" in line:
            ecgeb_result["july_amount"] = extract_value_between_labels(f"July {year_plus_1}", f"January {year_plus_2}", line)

        if f"October {year_plus_1}" in line:
            ecgeb_result["october_amount"] = extract_value_between_labels(f"October {year_plus_1}", f"April {year_plus_2}", line)

        if f"January {year_plus_2}" in line:
            ecgeb_result["january_amount"] = extract_value_between_labels(f"January {year_plus_2}", "", line)

        if f"April {year_plus_2}" in line:
            ecgeb_result["april_amount"] = extract_value_between_labels(f"April {year_plus_2}", "", line)

    return ecgeb_result

def extract_carbon_rebate(carbon_rebate_lines, year):
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
        # Extract Carbon Rebate total amount
        if "Line 5 plus line 6" in line:
            match = re.search(number_pattern, line)
            if match:
                carbon_rebate_result["carbon_rebate_amount"] = convert_to_float(match.group(0).replace(',', '').replace(' ', ''))

        if f"April {year_plus_1}" in line:
            carbon_rebate_result["april_amount"] = extract_value_between_labels(f"April {year_plus_1}", f"October {year_plus_1}", line)

        if f"July {year_plus_1}" in line:
            carbon_rebate_result["july_amount"] = extract_value_between_labels(f"July {year_plus_1}", f"January {year_plus_1}", line)

        if f"October {year_plus_1}" in line:
            carbon_rebate_result["october_amount"] = extract_value_between_labels(f"October {year_plus_1}", f"", line)

        if f"January {year_plus_2}" in line:
            carbon_rebate_result["january_amount"] = extract_value_between_labels(f"January {year_plus_2}", "", line)

    # Sum up all the amounts to get the total
    total_rebate = sum([carbon_rebate_result[month] for month in carbon_rebate_result if month != "carbon_rebate_amount"])
    carbon_rebate_result["carbon_rebate_amount"] = total_rebate

    return carbon_rebate_result

def extract_climate_action_credit(climate_action_lines, year):
    # Initialize the climate action results dictionary
    climate_action_results = {
        "climate_action_amount": 0.0,
        "july_amount": 0.0,
        "january_amount": 0.0,
        "october_amount": 0.0,
        "april_amount": 0.0
    }

    year_plus_1 = year + 1
    year_plus_2 = year + 2

    for line in climate_action_lines:
        # Process the first pair: "July {year_plus_1}" and "January {year_plus_2}"
        if f"July {year_plus_1}" in line:
            # Extract the value for July using "January {year_plus_2}" as the delimiter
            climate_action_results["july_amount"] = extract_value_between_labels(f"July {year_plus_1}", f"January {year_plus_2}", line)
        if f"January {year_plus_2}" in line:
            # Extract the value for January; no end label specified
            climate_action_results["january_amount"] = extract_value_between_labels(f"January {year_plus_2}", "", line)

        # Process the second pair: "October {year_plus_1}" and "April {year_plus_2}"
        if f"October {year_plus_1}" in line:
            climate_action_results["october_amount"] = extract_value_between_labels(f"October {year_plus_1}", f"April {year_plus_2}", line)
        if f"April {year_plus_2}" in line:
            climate_action_results["april_amount"] = extract_value_between_labels(f"April {year_plus_2}", "", line)

    # Sum up all the monthly values to get the total Climate Action Credit
    total_credit = (climate_action_results["july_amount"] +
                    climate_action_results["january_amount"] +
                    climate_action_results["october_amount"] +
                    climate_action_results["april_amount"])
    climate_action_results["climate_action_amount"] = total_credit

    return climate_action_results


def extract_ontario_trillium(ontario_trillium_lines, year):
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

    # Iterate over all the lines and extract the rebate amounts
    for line in ontario_trillium_lines:
        # Extract values for each month
        if f"July {year_plus_1}" in line and f"January {year_plus_2}" in line:
            ontario_trillium_result["july_amount"] = extract_value_between_labels(f"July {year_plus_1}", f"January {year_plus_2}", line)

        if f"August {year_plus_1}" in line and f"February {year_plus_2}" in line:
            ontario_trillium_result["august_amount"] = extract_value_between_labels(f"August {year_plus_1}", f"February {year_plus_2}", line)

        if f"September {year_plus_1}" in line and f"March {year_plus_2}" in line:
            ontario_trillium_result["september_amount"] = extract_value_between_labels(f"September {year_plus_1}", f"March {year_plus_2}", line)

        if f"October {year_plus_1}" in line and f"April {year_plus_2}" in line:
            ontario_trillium_result["october_amount"] = extract_value_between_labels(f"October {year_plus_1}", f"April {year_plus_2}", line)

        if f"November {year_plus_1}" in line and f"May {year_plus_2}" in line:
            ontario_trillium_result["november_amount"] = extract_value_between_labels(f"November {year_plus_1}", f"May {year_plus_2}", line)

        if f"December {year_plus_1}" in line and f"June {year_plus_2}" in line:
            ontario_trillium_result["december_amount"] = extract_value_between_labels(f"December {year_plus_1}", f"June {year_plus_2}", line)

        if f"January {year_plus_2}" in line:
            ontario_trillium_result["january_amount"] = extract_value_between_labels(f"January {year_plus_2}", f"", line)

        if f"February {year_plus_2}" in line:
            ontario_trillium_result["february_amount"] = extract_value_between_labels(f"February {year_plus_2}", f"", line)

        if f"March {year_plus_2}" in line:
            ontario_trillium_result["march_amount"] = extract_value_between_labels(f"March {year_plus_2}", f"", line)

        if f"April {year_plus_2}" in line:
            ontario_trillium_result["april_amount"] = extract_value_between_labels(f"April {year_plus_2}", f"", line)

        if f"May {year_plus_2}" in line:
            ontario_trillium_result["may_amount"] = extract_value_between_labels(f"May {year_plus_2}", f"", line)

        if f"June {year_plus_2}" in line:
            ontario_trillium_result["june_amount"] = extract_value_between_labels(f"June {year_plus_2}", f"", line)

    # Now sum the amounts to get the total carbon rebate amount
    total_rebate = sum(ontario_trillium_result[month] for month in ontario_trillium_result if month != "carbon_rebate_amount")
    ontario_trillium_result["ontario_trillium_amount"] = total_rebate

    return ontario_trillium_result



def extract_solidarity_credit(solidarity_lines, year):
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

    # Dynamic year calculation
    year_plus_1 = year + 1
    year_plus_2 = year + 2

    for line in solidarity_lines:
        # Extract amounts for each month by checking specific months and stopping at the next month's label
        if f"July {year_plus_1}" in line:
            solidarity_credit_result["july_amount"] = extract_value_between_labels(f"July {year_plus_1}", f"August {year_plus_1}", line)
            solidarity_credit_result["august_amount"] = extract_value_between_labels(f"August {year_plus_1}", f"September {year_plus_1}", line)
            solidarity_credit_result["september_amount"] = extract_value_between_labels(f"September {year_plus_1}", f"October {year_plus_1}", line)
            solidarity_credit_result["october_amount"] = extract_value_between_labels(f"October {year_plus_1}", f"November {year_plus_1}", line)
            solidarity_credit_result["november_amount"] = extract_value_between_labels(f"November {year_plus_1}", f"December {year_plus_1}", line)
            solidarity_credit_result["december_amount"] = extract_value_between_labels(f"December {year_plus_1}", "", line)

        # Extract amounts for the second line (January to June of the next year)
        if f"January {year_plus_2}" in line:
            solidarity_credit_result["january_amount"] = extract_value_between_labels(f"January {year_plus_2}", f"February {year_plus_2}", line)
            solidarity_credit_result["february_amount"] = extract_value_between_labels(f"February {year_plus_2}", f"March {year_plus_2}", line)
            solidarity_credit_result["march_amount"] = extract_value_between_labels(f"March {year_plus_2}", f"April {year_plus_2}", line)
            solidarity_credit_result["april_amount"] = extract_value_between_labels(f"April {year_plus_2}", f"May {year_plus_2}", line)
            solidarity_credit_result["may_amount"] = extract_value_between_labels(f"May {year_plus_2}", f"June {year_plus_2}", line)
            solidarity_credit_result["june_amount"] = extract_value_between_labels(f"June {year_plus_2}", "", line)

    # Sum all monthly amounts to calculate the total solidarity credit amount
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

    # Total solidarity credit amount
    solidarity_credit_result["solidarity_credit_amount"] = sum(monthly_amounts)

    return solidarity_credit_result


def extract_child_benefit(child_benefit_lines, year):
    # Initialize the result dictionary
    child_benefit_result = {
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

    # For overall CCB amount, keep your original extraction if it works well:
    number_pattern = r'(\d{1,3}(?:,\d{3})*\s\d{2})|(\d{2}\s\d{2})'
    for i, line in enumerate(child_benefit_lines):
        if "Total entitlement = " in line:
            match = re.search(number_pattern, line)
            if match:
                # This conversion assumes convert_to_float handles the conversion as needed.
                child_benefit_result["ccb_amount"] = convert_to_float(
                    match.group(0).replace(',', '').replace(' ', '')
                )

        # Process monthly amounts by checking if the line contains a month indicator
        if i < len(child_benefit_lines) - 1:
            # Define the month mapping based on the given year
            month_map = {
                f"July {year + 1}": "july_amount",
                f"August {year + 1}": "august_amount",
                f"September {year + 1}": "september_amount",
                f"October {year + 1}": "october_amount",
                f"November {year + 1}": "november_amount",
                f"December {year + 1}": "december_amount",
                f"January {year + 2}": "january_amount",
                f"February {year + 2}": "february_amount",
                f"March {year + 2}": "march_amount",
                f"April {year + 2}": "april_amount",
                f"May {year + 2}": "may_amount",
                f"June {year + 2}": "june_amount"
            }

            for month, key in month_map.items():
                if month in line:
                    # Extract all numeric tokens (digits with optional commas)
                    tokens = re.findall(r'\d+(?:,\d+)*', line)
                    if len(tokens) >= 2:
                        # Assume the last two tokens represent the dollars and cents
                        dollars = tokens[-2].replace(',', '')
                        cents = tokens[-1]
                        # Construct a string like "75.48" then convert to float
                        amount = float(dollars + '.' + cents)
                        child_benefit_result[key] = amount
                    break  # Exit loop once the month is processed

    return child_benefit_result


def extract_family_allowance(family_allowance_lines, year):
    # Initialize the result dictionary for Family Allowance
    family_allowance_result = {
        "fa_amount": 0.0,
        "july_amount": 0.0,
        "october_amount": 0.0,
        "january_amount": 0.0,
        "april_amount": 0.0
    }

    # Updated pattern to capture both formats: ### ## or #,### ##
    number_pattern = r'(\d{1,3}(?:,\d{3})*\s\d{2}|\d{1,3}\s\d{2})'

    # Define months we are interested in, dynamically using the provided year
    month_map = {
        f"July {year + 1}": "july_amount",
        f"October {year + 1}": "october_amount",
        f"January {year + 2}": "january_amount",
        f"April {year + 2}": "april_amount"
    }

    # Iterate through the lines to extract the Family Allowance amounts
    for line in family_allowance_lines:
        # Check for the relevant months in the line
        for month, key in month_map.items():
            if month in line:
                # Use regex to find all matching amounts in the line
                amounts = re.findall(number_pattern, line)
                if amounts:
                        if len(amounts) > 2:
                            # Combine the first two parts (e.g., '1' and '96' -> '196')
                            full_amount_str = amounts[0].replace(',', '').replace(' ', '') + amounts[1].replace(',', '').replace(' ', '')
                            family_allowance_result[key] = convert_to_float(full_amount_str)
                        elif len(amounts) <= 2:
                            # If there's only one amount, use it as is
                            family_allowance_result[key] = convert_to_float(amounts[0].replace(',', '').replace(' ', ''))

    # Apply the condition to remove the leftmost digit from July amount if needed
    if family_allowance_result["october_amount"] > 0:
        if family_allowance_result["july_amount"] > 2 * family_allowance_result["october_amount"]:
            family_allowance_result["july_amount"] = float(str(family_allowance_result["july_amount"])[1:])


    # Calculate the total Family Allowance amount by summing the relevant monthly amounts
    family_allowance_result["fa_amount"] = (
        family_allowance_result["july_amount"] +
        family_allowance_result["october_amount"] +
        family_allowance_result["january_amount"] +
        family_allowance_result["april_amount"]
    )

    return family_allowance_result



def extract_carryforward_summary(carryforward_lines, province):
    # Initialize the carryforward summary result dictionary
    carryforward_result = {
        "federal_tuition_amount": None,
        "quebec_tuition_20_percent": None,
        "quebec_tuition_8_percent": None
    }

    for line in carryforward_lines:
        # Extract federal tuition amount
        if "Tuition and educations amounts - federal" in line:
            value = line.split("Tuition and educations amounts - federal")[-1].strip().split()[0]
            # Check if the extracted value is a valid number
            if value.replace(',', '').replace('.', '').isdigit():
                carryforward_result["federal_tuition_amount"] = value
            else:
                carryforward_result["federal_tuition_amount"] = 0

        # Extract Quebec tuition amounts (20%)
        if "Tuition and educations amounts (20%) - Quebec" in line:
            value = line.split("Tuition and educations amounts (20%) - Quebec")[-1].strip().split()[0]
            if value.replace(',', '').replace('.', '').isdigit():
                carryforward_result["quebec_tuition_20_percent"] = value
            else:
                carryforward_result["quebec_tuition_20_percent"] = 0

        # Extract Quebec tuition amounts (8%)
        if "Tuition and educations amounts (8%) - Quebec" in line:
            value = line.split("Tuition and educations amounts (8%) - Quebec")[-1].strip().split()[0]
            if value.replace(',', '').replace('.', '').isdigit():
                carryforward_result["quebec_tuition_8_percent"] = value
            else:
                carryforward_result["quebec_tuition_8_percent"] = 0

        if province != "Quebec":
            if "Tuition and educations amounts" in line and "Provincial" not in line:
                value = line.split("Tuition and educations amounts")[-1].strip().split()[0]
                # Check if the extracted value is a valid number
                if value.replace(',', '').replace('.', '').isdigit():
                    carryforward_result["federal_tuition_amount"] = value
                else:
                    carryforward_result["federal_tuition_amount"] = 0
            carryforward_result["quebec_tuition_8_percent"] = 0
            carryforward_result["quebec_tuition_20_percent"] = 0

    return carryforward_result
