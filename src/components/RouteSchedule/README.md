#

This demonstrates the use of RouteSchedule.

```jsx
import React, { useState, useEffect } from 'react';
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

function RouteScheduleExample() {
  const [lineInfos, setLineInfos] = useState(null);
  const [fitlerActive, setFitlerActive] = useState(false);
  const [followActive, setFollowActive] = useState(false);
  const [center, setCenter] = useState(initialCenter);

  useEffect(()=> {
    trackerLayer.onClick((newLineInfos)=> {
      setLineInfos(newLineInfos);
    });
  }, []);

  return (
    <div className="rt-route-schedule-example">
      <RouteSchedule
        lineInfos={lineInfos}
        trackerLayer={trackerLayer}
        renderHeaderButtons={routeIdentifier => (
          <>
            <FilterButton
              title="Filter"
              active={fitlerActive}
              onChange={active => setFitlerActive(active)}
              routeIdentifier={routeIdentifier}
              trackerLayer={trackerLayer}
            />
            <FollowButton
              setCenter={setCenter}
              title="Follow"
              active={followActive}
              onChange={active => setFollowActive(active)}
              routeIdentifier={routeIdentifier}
              trackerLayer={trackerLayer}
            />
          </>
        )}
      />
      <BasicMap
        center={center}
        zoom={15}
        layers={layers}
      />
    </div>
  );
}

<RouteScheduleExample />;
```
