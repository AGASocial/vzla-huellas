import Busboy from "busboy";
import { Readable } from "stream";

type ParsedMultipart = {
  fields: Record<string, string>;
  file: { buffer: Buffer; filename: string; mimeType: string } | null;
};

/**
 * Parsea un request multipart/form-data leyendo el body crudo con busboy,
 * sin pasar por `Request.formData()`.
 *
 * Por qué: en producción (Vercel), `request.formData()` corrompió archivos
 * binarios - el archivo subido llegaba a Storage con los primeros bytes
 * reemplazados por el carácter de reemplazo UTF-8 (�), señal de que el
 * parser interno decodificó el body como texto en algún punto. Esto no
 * ocurría en `next dev`, solo en el build de producción. Parsear nosotros
 * mismos con busboy evita ese bug por completo.
 */
export async function parseMultipart(request: Request): Promise<ParsedMultipart> {
  const contentType = request.headers.get("content-type") ?? "";
  const bodyBuffer = Buffer.from(await request.arrayBuffer());

  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: { "content-type": contentType } });
    const fields: Record<string, string> = {};
    let file: ParsedMultipart["file"] = null;

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (name, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        if (name === "huella") {
          file = {
            buffer: Buffer.concat(chunks),
            filename: info.filename,
            mimeType: info.mimeType,
          };
        }
      });
    });

    busboy.on("finish", () => resolve({ fields, file }));
    busboy.on("error", reject);

    Readable.from(bodyBuffer).pipe(busboy);
  });
}
