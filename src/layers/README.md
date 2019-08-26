#

This demonstrates the use of TrajservLayer.

Filter possibility (case insensitive):

| Options  | Description            | Examples                                                                  |
|----------|------------------------|---------------------------------------------------------------------------|
| operator | filter by operator     | string: 'sbb', list: '(vbz\|zsg)'                                         |
| line     | filter by line number  | string: 'ICE',  list: '(s9\|s15\|s10)'                                    |
| route    | filter by route number | ferry in zurich: '01012', list of funiculars in Zurich: '(00191\|00040)'  |


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
