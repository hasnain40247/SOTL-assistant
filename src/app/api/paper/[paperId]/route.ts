import { NextResponse } from "next/server";
import type { NextApiRequest } from 'next'
import pdfParse from "pdf-parse";
import Papa from "papaparse";


function timestampToId(timestamp: string) {
    const date = new Date(timestamp);
    const yyyy = date.getFullYear().toString();
    const MM = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
  
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }
  
 
  
export async function GET(
  req: NextApiRequest,
  { params }: { params: { paperId: string } }
) {



const { paperId } = params;

  console.log("paperid",paperId);
  

  const csv = await fetch(
    "https://docs.google.com/spreadsheets/d/1yZKg5HYq4mG_oArnzAWdjgcfUODJNunWLu087h2v-Jc/gviz/tq?tqx=out:csv"
  ).then(res => res.text());

  const { data: rows } = Papa.parse(csv, { header: true });
  console.log("rows")





  const row = rows.find((r: any) => timestampToId(r.Timestamp) === paperId);
  console.log(row)



  if (!row) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const driveLink = row["Drive Link"];

  const match = driveLink.match(/\/d\/(.*?)\//);
  if (!match) {
    return NextResponse.json({ error: "Invalid Drive link" }, { status: 400 });
  }

  const fileId = match[1];

  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  const arrayBuffer = await fetch(directUrl).then(r => r.arrayBuffer());
  
  const pdfBuffer = Buffer.from(new Uint8Array(arrayBuffer));

  


  const pdfData = await pdfParse(pdfBuffer);




  return NextResponse.json({
    pdfText: pdfData.text,
    title: row.Title
  });
}
