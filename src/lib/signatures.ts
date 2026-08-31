import { inflateSync } from "node:zlib";

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function hasVisiblePngSignature(value: string | null | undefined) {
  const match = value?.match(/^data:image\/png;base64,([a-z0-9+/=]+)$/i);
  if (!match) return Boolean(value);

  try {
    const png = Buffer.from(match[1], "base64");
    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idat: Buffer[] = [];

    while (offset + 12 <= png.length) {
      const length = png.readUInt32BE(offset);
      const type = png.toString("ascii", offset + 4, offset + 8);
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd + 4 > png.length) return true;
      if (type === "IHDR") {
        width = png.readUInt32BE(dataStart);
        height = png.readUInt32BE(dataStart + 4);
        bitDepth = png[dataStart + 8];
        colorType = png[dataStart + 9];
      } else if (type === "IDAT") {
        idat.push(png.subarray(dataStart, dataEnd));
      } else if (type === "IEND") {
        break;
      }
      offset = dataEnd + 4;
    }

    // Canvas signatures are 8-bit, non-interlaced RGBA PNGs. Unknown formats
    // are treated as visible rather than suppressing a legitimate signature.
    if (!width || !height || bitDepth !== 8 || colorType !== 6) return true;

    const bytesPerPixel = 4;
    const rowBytes = width * bytesPerPixel;
    const inflated = inflateSync(Buffer.concat(idat));
    const previous = Buffer.alloc(rowBytes);
    let sourceOffset = 0;

    for (let y = 0; y < height; y += 1) {
      const filter = inflated[sourceOffset];
      sourceOffset += 1;
      const row = Buffer.alloc(rowBytes);
      for (let x = 0; x < rowBytes; x += 1) {
        const raw = inflated[sourceOffset + x];
        const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
        const up = previous[x];
        const upLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
        const reconstructed =
          filter === 0
            ? raw
            : filter === 1
              ? raw + left
              : filter === 2
                ? raw + up
                : filter === 3
                  ? raw + Math.floor((left + up) / 2)
                  : raw + paeth(left, up, upLeft);
        row[x] = reconstructed & 0xff;
      }
      for (let alpha = 3; alpha < rowBytes; alpha += bytesPerPixel) {
        if (row[alpha] > 0) return true;
      }
      row.copy(previous);
      sourceOffset += rowBytes;
    }
    return false;
  } catch {
    return true;
  }
}
