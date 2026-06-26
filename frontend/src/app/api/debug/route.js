import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const text = await req.text();
    const filePath = path.join(process.cwd(), 'dom_dump.html');
    fs.writeFileSync(filePath, text);
    return NextResponse.json({ success: true, filePath });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
