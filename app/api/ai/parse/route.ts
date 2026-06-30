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
- sähkö
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

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    // ✅ fixes
    if (!parsed.highlights) parsed.highlights = [];

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
  } else if (textLower.includes("sähkö")) {
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
  } else {
    parsed.maintenance_type = "muu";
  }
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