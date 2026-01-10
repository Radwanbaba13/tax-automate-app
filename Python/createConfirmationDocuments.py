import sys
import json
import ast
from json.decoder import JSONDecodeError

from models.createConfirmationEmail import create_confirmation_email
from models.createInvoicePDF import create_confirmation_invoice


def _parse_arg(arg_str, name="arg"):
    """Attempt to parse a CLI argument as JSON, falling back to Python literal eval or simple single-quote replacement.

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
            pass

        # Handle JS-like object literals with unquoted keys/values (very permissive heuristic)
        def _fix_js_like(s: str) -> str:
            # Quote unquoted keys: {key: -> {"key":
            s = re.sub(r'(?<=\{|,|\[)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:', r'"\1":', s)

            # Quote unquoted string values (avoid numbers, true, false, null)
            def _quote_value(m):
                val = m.group(1)
                if re.fullmatch(r"-?\d+(?:\.\d+)?", val):
                    return ':' + val
                if val in ("true", "false", "null"):
                    return ':' + val
                return ':"' + val + '"'

            s = re.sub(r':\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?=[,\}\]])', _quote_value, s)
            return s

        try:
            fixed = _fix_js_like(arg_str)
            return json.loads(fixed)
        except Exception:
            raise ValueError(f"Unable to parse {name} argument as JSON: {arg_str}")


if __name__ == "__main__":
    if len(sys.argv) >= 8:
        directory_path = sys.argv[1]
        clients = _parse_arg(sys.argv[2], "clients")
        selected_prices = _parse_arg(sys.argv[3], "selected_prices")
        invoice_details = _parse_arg(sys.argv[4], "invoice_details")
        tax_rate = _parse_arg(sys.argv[5], "tax_rate")
        includeTaxes = str(sys.argv[6]).lower() == "true"
        language = sys.argv[7]
        create_confirmation_email(directory_path, clients, selected_prices, tax_rate, includeTaxes, language)
        create_confirmation_invoice(directory_path,  selected_prices, invoice_details, tax_rate, includeTaxes, language)
    else:
        print("Insufficient arguments provided. Usage: <dir> <clients_json> <selected_prices_json> <invoice_details_json> <tax_rate_json> <includeTaxes> <language>")
