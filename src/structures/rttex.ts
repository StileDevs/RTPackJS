import { deflateSync, inflateSync } from "node:zlib";
import ImageV2 from "imagescript/v2/framebuffer";

function u8ToBuffer(u8: Uint8Array) {
  let buf = Buffer.alloc(u8.byteLength);
  for (let i = 0; i < buf.length; i++) buf[i] = u8[i];
  return buf;
}

function getLowestPowerOf2(n: number) {
  let lowest = 1;
  while (lowest < n) lowest <<= 1;
  return lowest;
}

export class RTTEX {
  public image: Buffer | undefined;

  // TODO:
  constructor(image?: Buffer) {
    this.image = image || undefined;
  }

  public static async decode(rttexImg: Buffer): Promise<Buffer> {
    let data = rttexImg;
    if (data.subarray(0, 6).toString() === "RTPACK") data = inflateSync(rttexImg.subarray(32));

    if (data.subarray(0, 6).toString() === "RTTXTR") {
      return u8ToBuffer(
        new ImageV2(data.readUInt16LE(12), data.readUInt16LE(8), data.subarray(124))
          .flip("vertical")
          .encode("png")
      );
    } else throw new Error("Invalid format type.");
  }

  public static async encode(img: Buffer): Promise<Buffer> {
    // TODO: add more format other than png, example jpg
    if (img.subarray(0, 6).toString() === "RTPACK" || img.subarray(0, 6).toString() === "RTTXTR")
      throw new TypeError("Invalid format, must be a PNG");

    let data = ImageV2.decode("png", img).flip("vertical");

    let rttex = Buffer.alloc(124);
    let pos = 8;

    rttex.write("RTTXTR");
    rttex.writeUint8(1, 6); // version
    rttex.writeUint8(1, 7); // reserved

    rttex.writeInt32LE(getLowestPowerOf2(data.height), pos); // width
    pos += 4;
    rttex.writeInt32LE(getLowestPowerOf2(data.width), pos); // height
    pos += 4;
    rttex.writeInt32LE(5121, pos); // format
    pos += 4;
    rttex.writeInt32LE(data.height, pos); // originalWidth
    pos += 4;
    rttex.writeInt32LE(data.width, pos); // originalHeight
    pos += 4;

    rttex.writeUInt8(1, pos); // isAlpha?
    pos += 1;

    rttex.writeUInt8(0, pos); // isCompressed?
    pos += 1;

    rttex.writeUInt16LE(1, pos); // reservedFlags
    pos += 2;

    rttex.writeInt32LE(0, pos); // mipmap
    pos += 4;

    // reserved (17)
    for (let i = 0; i < 16; i++) {
      rttex.writeInt32LE(0, pos);
      pos += 4;
    }

    const compressed = deflateSync(Buffer.concat([rttex, data.u8]));

    let rtpack = Buffer.alloc(32);
    pos = 8;
    rtpack.write("RTPACK");
    rtpack.writeUint8(1, 6); // version
    rtpack.writeUint8(1, 7); // reserved

    rtpack.writeUint32LE(compressed.length, pos); // compressedSize
    pos += 4;
    rtpack.writeUint32LE(124 + data.u8.length, pos); // decompressedSize
    pos += 4;

    rtpack.writeUint8(1, pos); // compressionType
    pos += 1;

    // reserved (16)
    for (let i = 0; i < 15; i++) {
      rttex.writeUint8(0, pos);
      pos += 1;
    }

    return Buffer.concat([rtpack, compressed]);
  }
}
