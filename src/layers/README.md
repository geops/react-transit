#

This demonstrates the use of TrajservLayer.

Filter possibility (case insensitive):

| Options           | Description            | Examples                                                               |
|-------------------|------------------------|------------------------------------------------------------------------|
| operator          | filter by operator     | string: 'sbb', list (regex): '(vbz\|zsg)'                              |
| publishedLineName | filter by line name    | string: 'ICE',  list: 'S9,S15,S10'                                     |
| tripNumber        | filter by trip number  | bus in zurich: '2068', list of buses in Zurich: '2068,3003,3451,3953'  |


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
    key: '5cc87b12d7c5370001c1d6551c1d597442444f8f8adc27fefe2f6b93',
  }),
];

<BasicMap center={[951560, 6002550]} zoom={14} layers={layers} />;
```
