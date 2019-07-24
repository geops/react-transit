#

This demonstrates the use of BasicMap.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import TrackerLayer from './TrackerLayer';
import OSMSource from 'ol/source/OSM';
import { getCenter} from 'ol/extent';

class BasicMapExample extends React.Component {
  constructor(props) {
    super(props);

    this.layers = [
      new Layer({
        name: 'Layer',
        olLayer: new TileLayer({
          source: new OSMSource(),
        }),
      }),
      new TrackerLayer(),
    ];
  }

  render() {
    return <BasicMap center={[951560, 6002550]} zoom={14} layers={this.layers} />;
  }
}

<BasicMapExample />;
```
