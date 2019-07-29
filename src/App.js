import React from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrackerLayer from './components/Tracker/TrackerLayer';

function App() {
  const layers = [
    new Layer({
      name: 'Layer',
      olLayer: new TileLayer({
        source: new OSMSource(),
      }),
    }),
    new TrackerLayer(),
  ];

  return <BasicMap center={[951560, 6002550]} zoom={14} layers={layers} />;
}

export default App;
