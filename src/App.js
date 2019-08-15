import React, { Component } from 'react';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import OLMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import { transform } from 'ol/proj';
import { defaults as defaultInteractions } from 'ol/interaction';
import Dialog from 'react-spatial/components/Dialog';
import Footer from 'react-spatial/components/Footer';
import DatePicker from 'react-datepicker';
import TrackerControl from './components/TrackerControl';
import TrajservLayer from './layers/TrajservLayer';
import Clock from './components/Clock';
import RouteSchedule from './components/RouteSchedule';
import LocalClock from './components/LocalClock';

import './themes/default/index.scss';
import 'react-datepicker/dist/react-datepicker.css';

class App extends Component {
  constructor() {
    super();

    this.state = {
      isRouteScheduleOpen: false,
      currTime: new Date(),
      lineInfos: null,
    };

    this.map = new OLMap({
      controls: [],
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
      }),
    });

    this.trackerLayer = new TrajservLayer({
      onClick: trajectory => {
        this.setState({
          isRouteScheduleOpen: true,
          lineInfos: trajectory,
        });
      },
    });

    // add onClick
    this.layers = [
      new Layer({
        name: 'Layer',
        olLayer: new TileLayer({
          source: new OSMSource(),
        }),
      }),
      this.trackerLayer,
    ];
    this.center = [951560, 6002550];
    this.zoom = 16;
  }

  componentDidUpdate() {
    const nextTick = setTimeout(() => {
      this.setState({ currTime: this.trackerLayer.getCurrTime() });
    }, 1000 / 60);
    return () => clearTimeout(nextTick);
  }

  animateToStation(station) {
    const view = this.map.getView();
    const zoom = view.getZoom();
    view.cancelAnimations();
    view.animate(
      { zoom },
      { center: transform(station.coordinates, 'EPSG:4326', 'EPSG:3857') },
    );
  }

  toggleRouteSchedule() {
    const { isRouteScheduleOpen } = this.state;
    this.setState({
      isRouteScheduleOpen: !isRouteScheduleOpen,
    });
  }

  render() {
    const { currTime, lineInfos, isRouteScheduleOpen } = this.state;

    return (
      <>
        <BasicMap
          map={this.map}
          center={this.center}
          zoom={this.zoom}
          layers={this.layers}
        />
        <Dialog
          className="rt-route-dialog"
          onClose={() => this.toggleRouteSchedule()}
          isOpen={isRouteScheduleOpen}
        >
          <RouteSchedule
            lineInfos={lineInfos}
            onStationClick={station => this.animateToStation(station)}
          />
        </Dialog>
        <Footer>
          <DatePicker
            selected={currTime}
            onChange={newDate => {
              this.trackerLayer.setCurrTime(newDate);
              this.setState({ currTime: this.trackerLayer.getCurrTime() });
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
            onChange={speed => this.trackerLayer.setSpeed(speed)}
          ></TrackerControl>
        </Footer>
      </>
    );
  }
}

export default App;
