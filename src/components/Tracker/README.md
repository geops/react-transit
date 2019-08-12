#

This demonstrates the use of TrackerLayer.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrackerLayer from 'react-transit/components/Tracker/TrackerLayer';

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
      new TrackerLayer({
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
