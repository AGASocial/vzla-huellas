import { NextResponse } from "next/server";

// Endpoint temporal de diagnóstico: lee el body crudo sin ningún parsing
// (ni formData, ni busboy) para aislar en qué capa se corrompen los bytes.
export async function POST(request: Request) {
  const buffer = Buffer.from(await request.arrayBuffer());
  return NextResponse.json({
    contentType: request.headers.get("content-type"),
    contentLength: request.headers.get("content-length"),
    byteLength: buffer.length,
    first40Hex: buffer.subarray(0, 40).toString("hex"),
  });
}
