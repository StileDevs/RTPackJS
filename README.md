# RTPackJS

> Converting a texture image into ProtonSDK standard texture.

## Requirements

- Node.js v14+

## Installing

npm

`npm install rtpackjs`

or using yarn

`yarn add rtpackjs`

## Example

```js
const { RTTEX } = require("rtpackjs");
const { writeFileSync } = require("fs");

const sample = fs.readFileSync("./test/image.rttex");

(async () => {
  const decoded = await RTTEX.decode(sample);
  writeFileSync("./test/image.png", decoded);

  const encoded = await RTTEX.encode(decoded);
  writeFileSync("./test/new_image.rttex", encoded);
})();

(async () => {
  const rttex = new RTTEX(sample);

  console.log(rttex);
  console.log(rttex.parseRTPACK());
  console.log(rttex.parseRTTXTR());
})();
```

## Credits

- [ProtonSDK](https://github.com/SethRobinson/proton/)
- [ZTzTopia (RTTEXConverterJS)](https://github.com/ZTzTopia/RTTEXConverterJS)
- [GuckTubeYT (RTTEXConverter)](https://github.com/GuckTubeYT/RTTEXConverter)
