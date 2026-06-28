import { NextResponse } from "next/server";

// Endpoint temporal de diagnóstico: lee el body crudo sin ningún parsing
// (ni formData, ni busboy) para aislar en qué capa se corrompen los bytes.
export async function POST(request: Request) {
  const buffer = Buffer.from(await request.arrayBuffer());
  const jpegMarkerIndex = buffer.indexOf(Buffer.from([0xff, 0xd8]));
  const replacementCharIndex = buffer.indexOf(Buffer.from("efbfbd", "hex"));

  return NextResponse.json({
    contentType: request.headers.get("content-type"),
    contentLength: request.headers.get("content-length"),
    byteLength: buffer.length,
    first160Hex: buffer.subarray(0, 160).toString("hex"),
    jpegMarkerIndex,
    aroundJpegMarkerHex:
      jpegMarkerIndex >= 0
        ? buffer.subarray(Math.max(0, jpegMarkerIndex - 10), jpegMarkerIndex + 30).toString("hex")
        : null,
    replacementCharIndex,
    aroundReplacementCharHex:
      replacementCharIndex >= 0
        ? buffer
            .subarray(Math.max(0, replacementCharIndex - 10), replacementCharIndex + 30)
            .toString("hex")
        : null,
  });
}
