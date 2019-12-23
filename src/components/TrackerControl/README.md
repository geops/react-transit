#

This demonstrates the use of TrackerControl.

The `apiKey` used here is for demonstration purposes only. Please get your own api key at https://developer.geops.io/.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrajservLayer from 'react-transit/layers/TrajservLayer';
import TrackerControl from 'react-transit/components/TrackerControl';

const trackerLayer = new TrajservLayer({
  // The `apiKey` used here is for demonstration purposes only.
  // Please get your own api key at https://developer.geops.io/.
  apiKey: window.apiKey,
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
