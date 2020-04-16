#

This demonstrates the use of TralisLayer.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TralisLayer from 'react-transit/layers/TralisLayer';

const layers = [
  new Layer({
    name: 'OSM',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
  // The `apiKey` used here is for demonstration purposes only.
  // Please get your own api key at https://developer.geops.io/.
  // Put here the url of the websocket
  new TralisLayer(),
];

<BasicMap
  center={[1286000, 6130000]}
  zoom={11}
  layers={layers}
/>
```
