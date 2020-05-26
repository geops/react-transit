#

This demonstrates the use of TralisLayer.

```jsx
import React, { useEffect } from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TralisLayer from 'react-transit/layers/TralisLayer';
import TrajservLayer from 'react-transit/layers/TrajservLayer';

const LiveDataExample = ()=> {
  useEffect(()=> {
    const map = new Map({
      target: 'map',
      view: new View({
        center: [951560, 6002550],
        zoom: 5,
      }),
      layers: [
        new TileLayer({
          source: new OSMSource(),
        }),
      ],
    });

    const liveDataLayer = new TralisLayer({
      url: '',
      apiKey: ''
    });

    liveDataLayer.init(map);
    map.updateSize();
  }, [])

  return <div id="map" className="rs-map"></div>;
}

<LiveDataExample />
```
