export interface RTPACK {
  type: string;
  version: number;
  reserved: number;
  compressedSize: number;
  decompressedSize: number;
  compressionType: number;
  reserved2: Uint8Array;
}

export interface RTTXTR {
  type: string;
  version: number;
  reserved: number;
  width: number;
  height: number;
  format: number;
  originalWidth: number;
  originalHeight: number;
  isAlpha: number;
  isCompressed: number;
  reservedFlags: number;
  mipmap: number;
  reserved2: Uint32Array;
}
