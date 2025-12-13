import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Exa from 'exa-js';
import Papa from 'papaparse';

const exa = new Exa(process.env.EXA_API_KEY!);

const SYSTEM_PROMPT = `
You are a literature scouting assistant for Scholarship of Teaching and Learning (SoTL).

You will be given a structured list of studies discovered by a search system.

Your task:
- Identify ONLY studies that clearly qualify as empirical SoTL research
- Exclude non-SoTL, theoretical, or purely disciplinary research
- Do NOT invent or infer missing details
- If a field is missing or "not specified", don't display it at all.

Ensure you list them one after the other in the following format:
## Title of study , *Year*
#### *Author*
#### Link

Summary
other details if any
`;

function truncate(text: string, maxChars = 1000) {
  if (!text) return 'Not specified';
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
}

export async function POST(req: Request) {
 
  
  const { query } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
  
        const csv = await fetch(
          'https://docs.google.com/spreadsheets/d/1yZKg5HYq4mG_oArnzAWdjgcfUODJNunWLu087h2v-Jc/gviz/tq?tqx=out:csv'
        ).then(res => res.text());

        const { data: rows } = Papa.parse(csv, { header: true });

        const curatedStudies = (rows as any[])
          .filter(row => row?.Title && row?.Link)
          .map(row => ({
            source: 'Curated Google Sheet',
            title: row.Title,
            authors: row.Author || 'Not specified',
            year: row.Year ? Number(row.Year) : 'Not specified',
            summary: truncate(row['Summary/Findings'], 600),
            link: row.Link,
            discipline: row.Discipline || 'Not specified',
            classFormat: row['Class Format'] || 'Not specified',
            learningStrategy: row['Learning Strategy'] || 'Not specified',
            dataCollection: row['Data Collection Instruments'] || 'Not specified',
          }));


  
        const research = await exa.research.create({
          instructions: `
Find peer-reviewed Scholarship of Teaching and Learning (SoTL) studies
related to:

"${query}"

Focus on empirical studies in higher education and college.
Return only relevant studies.
          `,
          model: 'exa-research-fast',
          outputSchema: {
            type: 'object',
            required: ['studies'],
            additionalProperties: false,
            properties: {
              studies: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['title', 'summary', 'link'],
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string' },
                    authors: { type: 'string' },
                    year: { type: 'number' },
                    summary: { type: 'string' },
                    link: { type: 'string' },
                  },
                },
              },
            },
          },
        });

        const exaStream = await exa.research.get(research.researchId, {
          stream: true,
        });

        let finalOutput: any | null = null;

        for await (const event of exaStream) {
          console.log(event);
          
          if (
            event.eventType === 'research-output' &&
            event.output?.outputType === 'completed'
          ) {
            finalOutput = event.output.parsed
              ? event.output.parsed
              : JSON.parse(event.output.content);
          }
        }

        if (!finalOutput) {
          throw new Error('Exa research completed but no final output was found');
        }


        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY!,
        });

        const claudeStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `
PRIORITIZED STUDIES (HIGH CONFIDENCE – FROM CURATED GOOGLE SHEET):
Evaluate these FIRST and prefer them when qualifying SoTL research.

${JSON.stringify(curatedStudies, null, 2)}

---

ADDITIONAL DISCOVERED STUDIES (FROM SEARCH SYSTEM):
Use only if relevant studies are not already covered above.

${JSON.stringify(finalOutput.studies, null, 2)}

---

TASK:
From ALL studies above, output ONLY those that qualify as empirical
Scholarship of Teaching and Learning (SoTL) research related to:

"${query}"

Rules:
- Prefer curated studies when applicable
- Do NOT duplicate studies
- Do NOT infer missing data
- If a field is missing, write "Not specified"
`,
            },
          ],
        });

        for await (const event of claudeStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        controller.close();
      } catch (err) {
        console.error('SoTL scout error:', err);
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
