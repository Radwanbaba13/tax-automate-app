import sys
import json
import ast
from json.decoder import JSONDecodeError

from models.createConfirmationEmail import create_confirmation_email
from models.createInvoicePDF import create_confirmation_invoice


def _parse_arg(arg_str, name="arg"):
    """
    Attempt to parse a CLI argument as JSON, falling back to Python literal eval
    or simple single-quote replacement.

    Raises ValueError if parsing fails.
    """
    if arg_str is None:
        return None

    try:
        return json.loads(arg_str)
    except JSONDecodeError:
        pass

    try:
        return ast.literal_eval(arg_str)
    except Exception:
        pass

    try:
        return json.loads(arg_str.replace("'", '"'))
    except Exception:
        raise ValueError(f"Unable to parse {name} argument as JSON: {arg_str}")


def main():
    if len(sys.argv) < 8:
        print(
            "Insufficient arguments provided. Usage:\n"
            "<dir> <clients_json> <selected_prices_json> "
            "<invoice_details_json> <tax_rate_json> <includeTaxes> <language>"
        )
        sys.exit(1)

    directory_path = sys.argv[1]
    clients = _parse_arg(sys.argv[2], "clients")
    selected_prices = _parse_arg(sys.argv[3], "selected_prices")
    invoice_details = _parse_arg(sys.argv[4], "invoice_details")
    tax_rate = _parse_arg(sys.argv[5], "tax_rate")
    include_taxes = str(sys.argv[6]).lower() == "true"
    language = sys.argv[7]

    create_confirmation_email(
        directory_path,
        clients,
        selected_prices,
        tax_rate,
        include_taxes,
        language,
    )

    create_confirmation_invoice(
        directory_path,
        selected_prices,
        invoice_details,
        tax_rate,
        include_taxes,
        language,
    )


if __name__ == "__main__":
    main()
