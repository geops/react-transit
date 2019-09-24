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
import FilterButton from 'react-transit/components/FilterButton';
import FollowButton from 'react-transit/components/FollowButton';

let firstRender = null;
const initialCenter = [951560, 6002550];
const trackerLayer = new TrajservLayer({
  key: '5cc87b12d7c5370001c1d6551c1d597442444f8f8adc27fefe2f6b93',
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

function RouteScheduleExample() {
  const [lineInfos, setLineInfos] = useState(null);
  const [center, setCenter] = useState(initialCenter);

  if (!firstRender) {
    firstRender = true;
    trackerLayer.onClick(setLineInfos);
  }

  return (
    <div className="rt-route-schedule-example">
      <BasicMap
        animationOptions={{
          center,
          duration: 60,
        }}
        center={initialCenter}
        zoom={14}
        layers={layers}
      />
      <RouteSchedule
        lineInfos={lineInfos}
        trackerLayer={trackerLayer}
        renderHeaderButtons={routeIdentifier => (
          <>
            <FilterButton
              title="Filter"
              routeIdentifier={routeIdentifier}
              trackerLayer={trackerLayer}
            />
            <FollowButton
              setCenter={setCenter}
              title="Follow"
              routeIdentifier={routeIdentifier}
              trackerLayer={trackerLayer}
            />
          </>
        )}
      />
    </div>
  );
}

<RouteScheduleExample />;
```
