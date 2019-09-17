#

This demonstrates the use of RouteSchedule.

```jsx
import React, { useState } from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrajservLayer from 'react-transit/layers/TrajservLayer';
import RouteSchedule from 'react-transit/components/RouteSchedule';

let firstRender = null;
const center = [951560, 6002550];
const zoom = 14;
const trackerLayer = new TrajservLayer();
const layers = [
  new Layer({
    name: 'Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
  trackerLayer,
];

function RouteScheduleExample() {
  const [lineInfos, setLineInfos] = useState(null);

  if (!firstRender) {
    firstRender = true;
    trackerLayer.onClick(setLineInfos);
  }

  return (
    <div className="rt-route-schedule-example">
      <BasicMap center={center} zoom={zoom} layers={layers} />
      <RouteSchedule lineInfos={lineInfos} trackerLayer={trackerLayer} />
    </div>
  );
}

<RouteScheduleExample />;
```
