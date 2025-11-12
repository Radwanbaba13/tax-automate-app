import sys
import json

from models.createConfirmationEmail import create_confirmation_email
from models.createInvoicePDF import create_confirmation_invoice

if __name__ == "__main__":
    if len(sys.argv) >= 5:
        directory_path = sys.argv[1]
        clients = json.loads(sys.argv[2])
        selected_prices = json.loads(sys.argv[3])
        invoice_details = json.loads(sys.argv[4])
        tax_rate = json.loads(sys.argv[5])
        includeTaxes = sys.argv[6].lower() == "true"
        language = sys.argv[7]
        create_confirmation_email(directory_path, clients, selected_prices, tax_rate, includeTaxes, language)
        create_confirmation_invoice(directory_path,  selected_prices, invoice_details, tax_rate, includeTaxes, language)
    else:
        print("Insufficient arguments provided.")
