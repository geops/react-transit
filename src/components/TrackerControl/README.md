#

This demonstrates the use of RouteSchedule.

```jsx
import React from 'react';
import Dialog from 'react-spatial/components/Dialog';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrajservLayer from 'react-transit/layers/TrajservLayer';
import RouteSchedule from 'react-transit/components/RouteSchedule';

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
      <TrackerControl onChange={speed => trackerLayer.setSpeed(speed)}>
      </TrackerControl>
    </>
  );
}

<TrackerControlExample/>;
```
