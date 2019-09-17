#

This demonstrates the use of TrackerControl.

```jsx
import React from 'react';
import Dialog from 'react-spatial/components/Dialog';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrajservLayer from 'react-transit/layers/TrajservLayer';
import TrackerControl from 'react-transit/components/TrackerControl';

const trackerLayer = new TrajservLayer();
const layers = [
  new Layer({
    name: 'Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
  trackerLayer
]

function  TrackerControlExample()  {
  return (
    <>
      <BasicMap center={[951560, 6002550]} zoom={14} layers={layers}/>
      <TrackerControl trackerLayer={trackerLayer} />
    </>
  );
}

<TrackerControlExample/>;
```
