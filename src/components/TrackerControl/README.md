#

This demonstrates the use of TrackerControl.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrajservLayer from 'react-transit/layers/TrajservLayer';
import TrackerControl from 'react-transit/components/TrackerControl';

const trackerLayer = new TrajservLayer({
  apiKey: '5cc87b12d7c5370001c1d6551c1d597442444f8f8adc27fefe2f6b93',
});
const layers = [
  new Layer({
    name: 'Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
  trackerLayer,
];

function TrackerControlExample() {
  return (
    <>
      <BasicMap center={[951560, 6002550]} zoom={14} layers={layers} />
      <TrackerControl trackerLayer={trackerLayer} />
    </>
  );
}

<TrackerControlExample />;
```
