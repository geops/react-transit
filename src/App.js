import React, { useState, useEffect } from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import Footer from 'react-spatial/components/Footer';
import DatePicker from 'react-datepicker';
import TrackerLayer from './components/Tracker/TrackerLayer';
import Clock from './components/Clock';
import LocalClock from './components/LocalClock';

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
  const [startTime] = useState(new Date());
  const [currTime, setCurrTime] = useState(startTime);
  const [speed, setSpeed] = useState(1);
  const [center] = useState([951560, 6002550]);
  const [zoom] = useState(16);

  useEffect(() => {
    // trackerLayer.stop();
    // trackerLayer.start();
  }, [startTime]);

  useEffect(() => {
    trackerLayer.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    const nextTick = setTimeout(() => {
      currTime.setSeconds(currTime.getSeconds() + 1); // + 1s
      const newCurrentTime = new Date(currTime);
      setCurrTime(newCurrentTime);
      trackerLayer.setCurrTime(newCurrentTime);
    }, 1000 / speed);
    return () => clearTimeout(nextTick);
  }, [currTime]);

  return (
    <>
      <BasicMap center={center} zoom={zoom} layers={layers} />
      <Footer>
        <DatePicker
          selected={currTime}
          onChange={newDate => {
            setCurrTime(newDate);
          }}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          timeCaption="time"
        />
        <Clock time={currTime}></Clock>
        <LocalClock time={currTime} timeZone={null}></LocalClock>
        <button
          type="button"
          onClick={() => setSpeed(speed <= 1 ? speed : speed - 1)}
        >
          {'<<'}
        </button>
        <button type="button" onClick={() => setSpeed(1)}>
          {'>'}
        </button>
        <button type="button" onClick={() => setSpeed(30)}>
          {'>>'}
        </button>
        <span>{`${speed}x`}</span>
      </Footer>
    </>
  );
}

export default App;
