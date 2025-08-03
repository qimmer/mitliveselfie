import { literal, pipe, regex, string, transform, union } from "valibot";
import { t } from "~/t";

export const danishPhoneNumber = () => union([pipe(
  string(),
  transform((input) => {
    // Remove all whitespace
    const cleaned = input.replace(/\s+/g, "");

    // Normalize prefix
    if (cleaned.startsWith("0045")) {
      return `+45${cleaned.slice(4)}`;
    } else if (/^\d{8}$/.test(cleaned)) {
      return `+45${cleaned}`;
    }
    return cleaned;
  }),
  regex(/^\+45\d{8}$/, t.phoneFormat)
), literal("")]);
