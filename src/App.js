import React, { useState, useEffect } from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import Footer from 'react-spatial/components/Footer';
import DatePicker from 'react-datepicker';
import TrackerControl from './components/TrackerControl';
import TrackerLayer from './components/Tracker/TrackerLayer';
import Clock from './components/Clock';
import LocalClock from './components/LocalClock';

import './App.scss';
import 'react-datepicker/dist/react-datepicker.css';

const trackerLayer = new TrackerLayer();
const layers = [
  new Layer({
    name: 'Layer',
    olLayer: new TileLayer({
      source: new OSMSource(),
    }),
  }),
  trackerLayer,
];

function App() {
  const [center] = useState([951560, 6002550]);
  const [zoom] = useState(16);
  const [currTime, setCurrTime] = useState(new Date());

  useEffect(() => {
    const nextTick = setTimeout(() => {
      setCurrTime(trackerLayer.getCurrTime());
    }, 1000 / 60);
    return () => clearTimeout(nextTick);
  }, [currTime]);

  return (
    <>
      <BasicMap center={center} zoom={zoom} layers={layers} />
      <Footer>
        <DatePicker
          selected={currTime}
          onChange={newDate => {
            trackerLayer.setCurrTime(newDate);
            setCurrTime(trackerLayer.getCurrTime());
          }}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          timeCaption="time"
        />
        <Clock date={currTime}></Clock>
        <LocalClock date={currTime} timeZone={null}></LocalClock>
        <TrackerControl
          onChange={speed => trackerLayer.setSpeed(speed)}
        ></TrackerControl>
      </Footer>
    </>
  );
}

export default App;
