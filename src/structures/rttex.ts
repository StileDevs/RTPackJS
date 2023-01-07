import { deflateSync, inflateSync } from "node:zlib";
import ImageV2 from "imagescript/v2/framebuffer";
import { RTPACK, RTTXTR } from "../types/RTTEX";

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
  public image: Buffer;
  public type: string | undefined;

  // TODO:
  constructor(image: Buffer) {
    if (!Buffer.isBuffer(image)) throw new Error("Please use buffer instead.");
    if (
      image.subarray(0, 6).toString() === "RTPACK" ||
      image.subarray(0, 6).toString() === "RTTXTR"
    ) {
    } else throw new Error("File header must be a RTPACK or RTTXTR");

    this.image = image;
    this.type = image.subarray(0, 6).toString() || undefined;
  }

  public parseRTPACK(): RTPACK {
    if (this.type !== "RTPACK") throw new TypeError("Invalid type of RTPACK");
    let data: RTPACK = {
      type: this.image.subarray(0, 6).toString(),
      version: this.image.readUint8(6),
      reserved: this.image.readUint8(7),
      compressedSize: this.image.readUInt32LE(8),
      decompressedSize: this.image.readUInt32LE(12),
      compressionType: this.image.readUint8(16),
      reserved2: new Uint8Array(16)
    };

    for (let i = 17; i <= 31; i++) {
      data.reserved2[i - 17] = this.image.readUint8(i);
    }

    return data;
  }

  public parseRTTXTR(): RTTXTR {
    let img = this.image;

    if (this.type === "RTPACK") {
      img = inflateSync(this.image.subarray(32));
    }

    if (img.subarray(0, 6).toString() !== "RTTXTR") throw new TypeError("Invalid type of RTTXTR");

    let data: RTTXTR = {
      type: img.subarray(0, 6).toString(),
      version: img.readUint8(6),
      reserved: img.readUint8(7),
      width: img.readUint32LE(8),
      height: img.readUint32LE(12),
      format: img.readUint32LE(16),
      originalWidth: img.readUint32LE(20),
      originalHeight: img.readUint32LE(24),
      isAlpha: img.readUint8(28),
      isCompressed: img.readUint8(29),
      reservedFlags: img.readUint16LE(30),
      mipmap: img.readUint32LE(32),
      reserved2: new Uint32Array(16)
    };

    let pos = 36;
    for (let i = 0; i < 16; i++) {
      data.reserved2[i] = img.readInt32LE(pos);
      pos += 4;
    }

    return data;
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
    rttex.writeUint8(0, 6); // version
    rttex.writeUint8(0, 7); // reserved

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
      rtpack.writeUint8(0, pos);
      pos += 1;
    }

    return Buffer.concat([rtpack, compressed]);
  }
}
