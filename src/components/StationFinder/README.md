#

This demonstrates the use of StationFinder.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import OLMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import StationFinder from 'react-transit/components/StationFinder';

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

function StationFinderExample() {
  return (
    <div className="rt-station-finder-example">
      <BasicMap
        map={map}
        center={[951560, 6002550]}
        zoom={14}
        layers={layers}
      />
      <StationFinder
        setCenter={setCenter}
        apiKey={apiPublicKey}
        autocompleteProps={{
          placeholder: 'Search a station...',
        }}
      />
    </div>
  );
}

<StationFinderExample />;
```
