#

This demonstrates the use of TrajservLayer.

```jsx
import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/layers/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrajservLayer from 'react-transit/layers/TrajservLayer';

class BasicMapExample extends React.Component {
  constructor(props) {
    super(props);

    this.trackerLayer = new TrajservLayer({
      onClick: f => console.log(f),
    }),
    this.layers = [
      new Layer({
        name: 'Layer',
        olLayer: new TileLayer({
          source: new OSMSource(),
        }),
      }),
      this.trackerLayer,
    ];
  }

  render() {
    return (
      <>
      <BasicMap center={[951560, 6002550]} zoom={14} layers={this.layers} />
      <button onClick={ ()=>{this.trackerLayer.setVisible(!this.trackerLayer.getVisible())}}>Toggle</button>
      </>
    );
  }
}

<BasicMapExample />;
```
