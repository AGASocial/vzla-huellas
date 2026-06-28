import sharp from "sharp";

/**
 * Convierte cualquier imagen subida a JPEG estándar. Necesario porque
 * algunos celulares (iPhone) suben fotos en HEIC, que el motor de matching
 * (SourceAFIS, vía Java ImageIO) no puede decodificar en absoluto, y que
 * `sharp` tampoco garantiza poder leer si la foto tiene metadata compleja
 * (ej. modo Retrato con mapa de profundidad).
 *
 * Si la conversión falla (HEIC no soportado, archivo corrupto, etc.) lanza
 * un error con un mensaje pensado para mostrarse directo al usuario.
 */
export async function normalizeToJpeg(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
  } catch {
    throw new Error(
      "No se pudo procesar esa imagen. Si la tomaste con un iPhone, prueba " +
        "tomar la foto directamente desde esta página (botón de cámara) en " +
        "vez de subir una ya guardada, o cambia el formato de cámara de tu " +
        "teléfono a 'Más compatible' en Ajustes > Cámara > Formatos."
    );
  }
}
