import OpenAI from "openai";
import PDFParser from "pdf2json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json();

    console.log("AI received file:", fileUrl);

    const pdfRes = await fetch(fileUrl);
    const buffer = Buffer.from(await pdfRes.arrayBuffer());

    const pdfParser = new PDFParser();

    const text: string = await new Promise((resolve) => {
      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          let result = "";

          if (!pdfData?.Pages) {
            console.log("No Pages");
            return resolve("");
          }

          pdfData.Pages.forEach((page: any) => {
            page.Texts?.forEach((item: any) => {
              item.R?.forEach((r: any) => {
                try {
                  result += decodeURIComponent(r.T) + " ";
                } catch {
                  result += r.T + " ";
                }
              });
            });
          });

          resolve(result);
        } catch {
          resolve("");
        }
      });

      pdfParser.on("pdfParser_dataError", () => resolve(""));
      pdfParser.parseBuffer(buffer);
    });

    const cleanText = text.replace(/\s+/g, " ");
    console.log("TEXT LENGTH:", cleanText.length);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Return ONLY valid JSON.

{
  "description": "",
  "date": "",
  "due_date": "",
  "company": "",
  "invoice_number": "",
  "total_amount": "",
  "vat": "",
  "work_amount": "",
  "is_household_deduction": false,
  "location": "",
  "items": [
    { "name": "", "price": "" }
  ],
  "notes_short": "",
  "highlights": [],
  "maintenance_type": "",
  "additional_notes": "",
  "document_notes": [
    {
      "type": "",
      "content": ""
    }
  ]
}


- ALWAYS extract basic invoice fields if present:

1. company = seller / supplier name (e.g. "Tulisijamestarit Oy")
2. date = invoice date (LASKU Päivämäärä)
3. due_date = Eräpäivä
4. invoice_number = Laskunumero
5. total_amount = Maksettava yhteensä
6. vat = Alv yhteensä

- IMPORTANT:
  Do NOT put invoice fields into highlights if they belong to structured fields.

  If text contains:
  - "Eräpäivä 16.07.2026" → due_date = "2026-07-16"
  - "Laskunumero 7263112343" → invoice_number = "7263112343"
  - "Laskun loppusumma yhteensä 28,20 EUR" → total_amount = "28.20"
  - "Alv yhteensä 5,23" → vat = "5.23"

  These values must be placed in their own JSON fields first.

- These MUST be extracted even if the document is messy
- These are higher priority than highlights

- If the document is a product/invoice list:
  → use product names to generate description

Example:
"Emma takkaleivinuuni muurattuna" → description


- highlights = list of important concrete facts from the document

Examples:
- "Ilmalämpöpumpun asennus tehty"
- "Työn osuus 650 € (kotitalousvähennyskelpoinen)"
- "Asennus sisältää sisä- ja ulkoyksikön"
- "Takuu"
- "Käyttöönottopäivämäärä 1.1.2025"
- "Käyttöönottopöytäkirja"
- "Huomioitavaa"
- "Voimassa"

- Keep highlights short and factual
- Prefer actions and key numbers

- maintenance_type = classify maintenance type

Examples:
- nuohous
- likakaivo
- suodatin
- ilmalämpöpumppu
- sahkomaksu
- sahkonsiirtomaksu
- laajakaistaliittymä
- vesi
- muu

- Extract everything possible from text
- Do NOT invent missing data
- Finnish output preferred


- The document may contain tables, columns or broken formatting.
- You must still extract structured fields reliably.

- The text may be broken, unordered or extracted from tables.
- Words may appear without clear sentences.

- You MUST still identify key invoice fields using pattern recognition:
  look for:
    - "Oy" → company
    - "Lasku", "Päivämäärä" → date
    - numbers with € → total_amount
    - "Laskunumero" → invoice_number

- If words are merged or messy, still extract the most probable values.

- For description:
  If no clear description exists, use product/service names from the document.

Example:
"Emma takkaleivinuuni muurattuna" → description

Internet / phone invoices: If the supplier is Moi Mobiili Oy, Telia, Elisa or DNA, classify as:
maintenance_type = "laajakaistaliittymä"

If the invoice contains Kotinetti, 4G, 5G, simmi, liittymä or puhelin, classify as:
maintenance_type = "laajakaistaliittymä"

Use maintenance_type = "laajakaistaliittymä" when the document is about

- internet
- laajakaista
- mobiililaajakaista
- puhelinliittymä
- 4G
- 5G
- valokuitu
- Telia
- Elisa
- DNA
- Moi Mobiili
- separate different numbers and usagetypes eg. phone, mobile, internet, data, etc. if present in the document.

Electricity invoices:
- Use maintenance_type = "sahkomaksu" when the document is about
- electricity
- sähkö
- sähkölasku
- collect data about electricity usage, consumption, and costs etc.marginals and spot prices, if present in the document.
- Use maintenance_type = "sahkonsiirto" when the document is about
- sähkönsiirto
- sähkönsiirtomaksu


`
        },
        {
          role: "user",
          content: cleanText.slice(0, 15000),
        },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0].message.content || "{}";

    function toIsoDate(value: string) {
  const match = value.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (!match) return "";

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];

  return `${year}-${month}-${day}`;
}

function normalizeAmount(value: string) {
  return value.replace(/\s/g, "").replace(",", ".");
}

function extractMissingInvoiceFields(parsed: any, sourceText: string) {
  const text = sourceText.replace(/\s+/g, " ");

  if (!parsed.due_date) {
    const match = text.match(/eräpäivä\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i);
    if (match) parsed.due_date = toIsoDate(match[1]);
  }

  if (!parsed.date) {
    const match = text.match(
      /(laskun\s+päivä|päivämäärä|laskupäivä)\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i
    );
    if (match) parsed.date = toIsoDate(match[2]);
  }

  if (!parsed.invoice_number) {
    const match = text.match(/laskunumero\s*:?\s*([A-ZÅÄÖ0-9-]+)/i);
    if (match) parsed.invoice_number = match[1];
  }

  if (!parsed.total_amount) {
    const match = text.match(
      /(loppusumma|maksettava\s+yhteensä|yhteensä|summa)\s*:?\s*(\d[\d\s]*[,.]\d{2})\s*(eur|€)?/i
    );
    if (match) parsed.total_amount = normalizeAmount(match[2]);
  }

  if (!parsed.vat) {
    const match = text.match(
      /(alv|arvonlisävero)\s*(yhteensä)?\s*:?\s*(\d[\d\s]*[,.]\d{2})/i
    );
    if (match) parsed.vat = normalizeAmount(match[3]);
  }

  return parsed;
}

function removeStructuredFactsFromHighlights(parsed: any) {
  if (!Array.isArray(parsed.highlights)) parsed.highlights = [];

  parsed.highlights = parsed.highlights.filter((item: string) => {
    const text = String(item).toLowerCase();

    if (parsed.due_date && text.includes("eräpäivä")) return false;
    if (parsed.date && (text.includes("päivämäärä") || text.includes("laskun päivä"))) return false;
    if (parsed.invoice_number && text.includes("laskunumero")) return false;
    if (
      parsed.total_amount &&
      (text.includes("loppusumma") ||
        text.includes("maksettava") ||
        text.includes("yhteensä"))
    ) {
      return false;
    }

    return true;
  });

  return parsed;
}

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    // ✅ fixes
    if (!parsed.highlights) parsed.highlights = [];
    parsed = extractMissingInvoiceFields(parsed, cleanText);
parsed = removeStructuredFactsFromHighlights(parsed);

const textLower = cleanText.toLowerCase();

function forceKnownMaintenanceType(parsed: any) {
  if (
    textLower.includes("netflix") ||
    textLower.includes("disney+") ||
    textLower.includes("disney plus") ||
    textLower.includes("hbo") ||
    textLower.includes("viaplay") ||
    textLower.includes("prime video") ||
    textLower.includes("apple tv") ||
    textLower.includes("youtube premium") ||
    textLower.includes("spotify")
  ) {
    parsed.maintenance_type = "suoratoistopalvelut";
    return parsed;
  }

  if (
    textLower.includes("moi mobiili") ||
    textLower.includes("kotinetti") ||
    textLower.includes("liittymä") ||
    textLower.includes("simmi") ||
    textLower.includes("puhelin") ||
    textLower.includes("mobiili") ||
    textLower.includes("laajakaista") ||
    textLower.includes("internet") ||
    textLower.includes("netti") ||
    textLower.includes("valokuitu") ||
    textLower.includes("4g") ||
    textLower.includes("5g") ||
    textLower.includes("telia") ||
    textLower.includes("elisa") ||
    textLower.includes("dna") ||
    textLower.includes("moi")
  ) {
    parsed.maintenance_type = "laajakaistaliittymä";
    return parsed;
  }

  if (
    textLower.includes("sähkönsiirto") ||
    textLower.includes("sähkönsiirtomaksu")
  ) {
    parsed.maintenance_type = "sahkonsiirto";
    return parsed;
  }

  if (
    textLower.includes("sähkölasku") ||
    textLower.includes("sähköenergia") ||
    textLower.includes("pörssisähkö") ||
    textLower.includes("spot") ||
    textLower.includes("kwh") ||
    textLower.includes("kulutus")
  ) {
    parsed.maintenance_type = "sahkomaksu";
    return parsed;
  }

  return parsed;
}

parsed = forceKnownMaintenanceType(parsed);

const validMaintenanceTypes = new Set([
  "nuohous",
  "likakaivo",
  "jatehuolto",
  "biojatehuolto",
  "suodatin",
  "ilp_suodatin",
  "ilmalämpöpumppu",
  "sähkö",
  "sahkomaksu",
  "sahkonsiirto",
  "laajakaistaliittymä",
  "suoratoistopalvelut",
  "suoratoistopalvelut",
"lemmikki_terveys",
"lemmikki_nayttely",
"lemmikki_kayttokoe",
"lemmikki_muu",
  "vesi",
  "juomavesi",
  "maalämpö",
  "rakennus",
  "remontointi",
  "muu",
]);


// Jos AI palautti tuntemattoman arvon, pakotetaan fallbackiin
if (!validMaintenanceTypes.has(parsed.maintenance_type)) {
  parsed.maintenance_type = "";
}

    // ✅ kotitalousvähennys
    if (parsed.work_amount && !parsed.is_household_deduction) {
      parsed.is_household_deduction = true;

      parsed.highlights.push(
        `Työn osuus ${parsed.work_amount} € (kotitalousvähennyskelpoinen)`
      );
    }

    // ✅ period tunnistus → highlightiksi
const periodMatch = cleanText.match(
  /\d{1,2}[./]\d{1,2}[./]\d{2,4}\s*[-–]\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}/
);

if (periodMatch) {
  const periodText = `Kausi: ${periodMatch[0]}`;

  if (!parsed.highlights.includes(periodText)) {
    parsed.highlights.push(periodText);
  }
}


    // ✅ maintenance fallback (parannettu)
if (!parsed.maintenance_type || parsed.maintenance_type === "muu") {
  const textLower = cleanText.toLowerCase();

  if (textLower.includes("nuohous")) {
    parsed.maintenance_type = "nuohous";
  } else if (textLower.includes("kaivo")) {
    parsed.maintenance_type = "likakaivo";
  } else if (textLower.includes("bio")) {
    parsed.maintenance_type = "biojatehuolto";
  } else if (textLower.includes("jäte")) {
    parsed.maintenance_type = "jatehuolto";
  } else if (textLower.includes("suodatin")) {
    if (textLower.includes("ilmalämpö")) {
      parsed.maintenance_type = "ilp_suodatin";
    } else {
      parsed.maintenance_type = "suodatin";
    }
  } else if (textLower.includes("ilmalämpöpumppu")) {
    parsed.maintenance_type = "ilmalämpöpumppu";
  } else if (
  textLower.includes("sähkötyö") ||
  textLower.includes("sähköasennus") ||
  textLower.includes("sähköurakointi")
) {
  parsed.maintenance_type = "sähkö";
  } else if (textLower.includes("vesi")) {
    parsed.maintenance_type = "vesi";
  } else if (textLower.includes("maalämpö")) {
    parsed.maintenance_type = "maalämpö";
  } else if (
    textLower.includes("asennus") ||
    textLower.includes("rakennus") ||
    textLower.includes("valmistelu") ||
    textLower.includes("työ")
  ) {
    parsed.maintenance_type = "rakennus";
   } } else if (
  textLower.includes("netflix") ||
  textLower.includes("disney+") ||
  textLower.includes("disney plus") ||
  textLower.includes("max") ||
  textLower.includes("hbo") ||
  textLower.includes("viaplay") ||
  textLower.includes("amazon prime") ||
  textLower.includes("prime video") ||
  textLower.includes("apple tv") ||
  textLower.includes("youtube premium") ||
  textLower.includes("spotify")
) {
  parsed.maintenance_type = "suoratoistopalvelut";
} else {
  parsed.maintenance_type = "muu";
} 


    // ✅ poistetaan duplikaatit
    parsed.highlights = [...new Set(parsed.highlights)];

    return new Response(
      JSON.stringify({ parsed: JSON.stringify(parsed) }),
      { status: 200 }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ parsed: "{}" }),
      { status: 200 }
    );
  }
}