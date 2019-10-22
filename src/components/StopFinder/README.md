#

This demonstrates the use of StopFinder.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import OLMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import StopFinder from 'react-transit/components/StopFinder';

const map = new OLMap({ controls: [] });
const layers = [
  new Layer({
    name: 'Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
];
const setCenter = newCenter => map.getView().setCenter(newCenter);
const apiPublicKey = '5cc87b12d7c5370001c1d6551c1d597442444f8f8adc27fefe2f6b93';

function StopFinderExample() {
  return (
    <div className="rt-stop-finder-example">
      <BasicMap
        map={map}
        center={[951560, 6002550]}
        zoom={14}
        layers={layers}
      />
      <StopFinder
        onSelect={setCenter}
        apiKey={apiPublicKey}
        autocompleteProps={{
          placeholder: 'Search stops',
        }}
      />
    </div>
  );
}

<StopFinderExample />;
```
