const { RTTEX } = require("../dist/index");
const fs = require("node:fs");

// const sample = fs.readFileSync("./test/gui_shop_buybanner.rttex");
const sample = fs.readFileSync("./test/news_banner.rttex");

(async () => {
  console.time("Decoding_PNG_TO_RTTEX");
  const decoded = await RTTEX.decode(sample);

  fs.writeFileSync("./test/news_banner.png", decoded);

  console.timeEnd("Decoding_PNG_TO_RTTEX");

  console.time("Encode_PNG_TO_RTTEX");
  const encoded = await RTTEX.encode(decoded);
  fs.writeFileSync("./test/news_banner_new.rttex", encoded);

  console.timeEnd("Encode_PNG_TO_RTTEX");

  console.time("Decoding_PNG_TO_RTTEX_2");
  const decoded2 = await RTTEX.decode(encoded);

  fs.writeFileSync("./test/news_banner_new.png", decoded2);

  console.timeEnd("Decoding_PNG_TO_RTTEX_2");
})();

(async () => {
  const rttex = new RTTEX(sample);

  console.log(rttex);
  console.log(rttex.parseRTPACK());
  console.log(rttex.parseRTTXTR());
})();
