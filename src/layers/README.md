#

This demonstrates the use of TrajservLayer.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrajservLayer from 'react-transit/layers/TrajservLayer';


const layers = [
  new Layer({
    name: 'Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
  new TrajservLayer({
    onClick: f => console.log(f),
  }),
];

<BasicMap center={[951560, 6002550]} zoom={14} layers={layers} />;
```
