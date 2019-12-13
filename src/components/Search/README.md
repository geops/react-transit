#

This demonstrates the use of the Search component.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import OLMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import OSMSource from 'ol/source/OSM';
import Search from 'react-transit/components/Search';

const map = new OLMap({ controls: [] });
const layers = [
  new Layer({
    name: 'Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
];
const setCenter = ({ geometry }) => {
  map.getView().setCenter(fromLonLat(geometry.coordinates, 'EPSG:3857'));
};

const apiPublicKey = '5cc87b12d7c5370001c1d6551c1d597442444f8f8adc27fefe2f6b93';

function SearchExample() {
  return (
    <div className="rt-stop-finder-example">
      <BasicMap
        map={map}
        center={[951560, 6002550]}
        zoom={14}
        layers={layers}
      />
      <Search
        onSelect={setCenter}
        apiKey={apiPublicKey}
        inputProps={{
          placeholder: 'Search stops',
        }}
      />
    </div>
  );
}

<SearchExample />;
```
