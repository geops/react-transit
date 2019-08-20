#

This demonstrates the use of TrajservLayer.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrackerMapboxSource from 'react-transit/layers/TrackerMapboxSource';

class BasicMapExample extends React.Component {
  constructor(props) {
    super(props);

    this.layers = [
      new TrackerMapboxSource({
        name: 'Mapbox',
        url: `https://maps.geops.io/styles/trafimage_perimeter_v2/style.json?key=5cc87b12d7c5370001c1d6557f01e26728174c1fa19d33afe303b910`,
        onClick: f => console.log(f),
      }),
    ];
  }

  render() {
    return (
      <BasicMap center={[951560, 6002550]} zoom={14} layers={this.layers} />
    );
  }
}

<BasicMapExample />;
```
