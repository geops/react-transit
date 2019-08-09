import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'react-spatial/layers/VectorLayer';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';
import { buffer, containsCoordinate, getWidth } from 'ol/extent';
import Tracker from './Tracker';
import {
  getRadius,
  bgColors,
  textColors,
  timeSteps,
} from '../../config/tracker';

/**
 * Trackerlayer.
 * Responsible for loading tracker data.
 */
class TrackerLayer extends VectorLayer {
  static getDateString(now) {
    const n = now || new Date();
    let month = (n.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;
    let day = n.getDate().toString();
    day = day.length === 1 ? `0${day}` : day;

    return [now.getFullYear(), month, day].join('');
  }

  static getTimeString(time) {
    return [
      time.getHours() - 2,
      time.getMinutes(),
      `${time.getSeconds()}.${time.getMilliseconds()}`,
    ].join(':');
  }

  constructor(options = {}) {
    super({
      name: 'Tracker',
      olLayer: new OLVectorLayer({
        zIndex: 5,
        source: new VectorSource(),
      }),
      ...options,
    });

    this.url =
      options.url ||
      'https://backend1.tracker.geops.de' ||
      'https://tracker.geops.io';

    this.styleCache = {};

    this.currentOffset = 0;

    this.requestIntervalSeconds = 3;

    this.intervalStarted = false;

    this.hoverVehicleId = null;

    this.currTime = new Date();

    this.lastUpdateTime = new Date();

    this.lastRequestTime = 0;

    this.speed = 1;

    this.fps = 60;
  }

  startInterval() {
    window.clearInterval(this.updateInterval);
    this.updateInterval = window.setInterval(() => {
      this.updateTrajectories();
    }, this.requestIntervalSeconds * 1000);
  }

  startUpdateTime() {
    this.stopUpdateTime();
    this.updateTime = setInterval(() => {
      this.currTime.setMilliseconds(
        this.currTime.getMilliseconds() +
          (new Date() - this.lastUpdateTime) * this.speed,
      );
      this.setCurrTime(this.currTime);
    }, 1000 / this.fps);
  }

  stopUpdateTime() {
    window.clearInterval(this.updateTime);
  }

  getCurrTime() {
    return this.currTime;
  }

  setCurrTime(time) {
    const newTime = new Date(time);
    this.currTime = newTime;
    this.lastUpdateTime = new Date();
    this.tracker.renderTrajectory(this.currTime);
  }

  getSpeed() {
    return this.speed;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  getVehicleAtCoordinate(coordinate) {
    const res = this.map.getView().getResolution();
    const ext = buffer([...coordinate, ...coordinate], 10 * res);
    const trajectories = this.tracker.getTrajectories();

    for (let i = 0; i < trajectories.length; i += 1) {
      if (
        trajectories[i].coordinate &&
        containsCoordinate(ext, trajectories[i].coordinate)
      ) {
        return trajectories[i];
      }
    }

    return null;
  }

  init(map) {
    super.init(map);

    this.tracker = new Tracker(map);

    this.map.on('postrender', () => {
      this.tracker.renderTrajectory(this.currTime);
    });

    this.map.on('moveend', () => {
      const z = this.map.getView().getZoom();

      if (z !== this.currentZoom) {
        this.currentZoom = z;
        this.styleCache = {};
        this.fps = Math.round(
          Math.min(20000, Math.max(1000 / 60, timeSteps[z] / this.speed)),
        );
        this.startUpdateTime();
      }
      this.tracker.renderTrajectory(this.currTime);
      this.updateTrajectories();
    });

    this.map.on('pointermove', e => {
      const vehicle = this.getVehicleAtCoordinate(e.coordinate);
      this.map.getTarget().style.cursor = vehicle ? 'pointer' : 'auto';
      this.hoverVehicleId = vehicle ? vehicle.id : null;
    });

    this.map.on('singleclick', e => {
      const vehicle = this.getVehicleAtCoordinate(e.coordinate);
      const features = [];

      if (vehicle) {
        const geom = vehicle.coordinate ? new Point(vehicle.coordinate) : null;
        features.push(new Feature({ geometry: geom, ...vehicle }));
      }

      this.clickCallbacks.forEach(c => c(features, this, e));
    });

    this.updateTrajectories();
    this.startInterval();
    this.startUpdateTime();
    this.tracker.setStyle((props, r) => this.style(props, r));
  }

  style(props) {
    const { type, name, id, color } = props;
    const z = Math.min(Math.floor(this.currentZoom || 1), 16);
    const hover = this.hoverVehicleId === id;

    this.styleCache[z] = this.styleCache[z] || {};
    this.styleCache[z][type] = this.styleCache[z][type] || {};
    this.styleCache[z][type][name] = this.styleCache[z][type][name] || {};

    if (!this.styleCache[z][type][name][hover]) {
      let radius = getRadius(type, z);

      if (hover) {
        radius += 5;
      }

      const c = document.createElement('canvas');
      c.width = radius * 2 + 4; // + 4 for border
      c.height = c.width;
      const ctx = c.getContext('2d');

      ctx.beginPath();
      ctx.arc(radius + 2, radius + 2, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color || bgColors[type];
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#003300';
      ctx.stroke();

      if (z > 12) {
        const fontSize = Math.max(radius, 10);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = textColors[type];
        ctx.font = `${fontSize}px Arial`;

        const textSize = ctx.measureText(name);

        if (textSize.width < c.width - 6 && fontSize < c.height - 6) {
          ctx.fillText(name, radius + 2, radius + 2);
        }
      }

      this.styleCache[z][type][name][hover] = c;
    }

    return this.styleCache[z][type][name][hover];
  }

  getUrlParams(extraParams = {}) {
    const ext = this.map.getView().calculateExtent();
    const bufferExt = buffer(ext, getWidth(ext) / 10);
    const now = this.currTime;

    let diff = true;

    if (
      this.later &&
      now.getTime() > this.later.getTime() - 3000 * this.speed
    ) {
      diff = false;
    }

    if (!this.later || !diff) {
      const intervalMilliscds = this.speed * 20000; // 20 seconds, arbitrary value, could be : (this.requestIntervalSeconds + 1) * 1000;
      const later = new Date(now.getTime() + intervalMilliscds);
      this.later = later;
    }

    const btime = TrackerLayer.getTimeString(now);

    const params = {
      ...extraParams,
      swy: bufferExt[0],
      swx: bufferExt[1],
      nex: bufferExt[3],
      ney: bufferExt[2],
      orx: ext[0],
      ory: ext[3],
      btime,
      etime: TrackerLayer.getTimeString(this.later),
      date: TrackerLayer.getDateString(now),
      rid: 1,
      a: 1,
      cd: 1,
      nm: 1,
      fl: 1,
      s: this.map.getView().getZoom() < 10 ? 1 : 0,
      z: this.map.getView().getZoom(),
      // toff: this.currTime.getTime() / 1000,
    };

    // Allow to load only differences between the last request,
    // but currently the Tracker render method doesn't manage to render only diff.
    /* if (diff) {
      // Not working
      params.diff = this.lastRequestTime;
    } */

    return Object.keys(params)
      .map(k => `${k}=${params[k]}`)
      .join('&');
  }

  fetchTrajectory(id) {
    const params = this.getUrlParams({
      id,
      time: TrackerLayer.getTimeString(new Date()),
    });

    const url = `${this.url}/trajectory?${params}`;
    return fetch(url).then(res => res.json());
  }

  fetchTrajectories() {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;
    const trackerUrl = `${this.url}/trajectories?${this.getUrlParams()}`;
    return fetch(trackerUrl, { signal }).then(data => data.json());
  }

  updateTrajectories() {
    this.fetchTrajectories().then(data => {
      // For debug purpose , display the trajectory
      // this.olLayer.getSource().clear();

      this.lastRequestTime = data.t;
      this.currentOffset = data.o || 0;
      const trajectories = [];

      for (let i = 0; i < data.a.length; i += 1) {
        const coords = [];
        const timeIntervals = [];
        const { i: id, p: paths, t: type, n: name, c: color } = data.a[i];

        for (let j = 0; j < paths.length; j += 1) {
          const path = paths[j];
          const startTime = (path[0].a || data.t) * 1000;
          const endTime = (path[path.length - 1].a || data.t + 20) * 1000;

          for (let k = 0; k < path.length; k += 1) {
            // d: delay. When the train is stopped at a station.
            const { x, y, a: timeAtPixelInScds, d: delay } = path[k];
            coords.push(this.map.getCoordinateFromPixel([x, y]));

            // If a pixel is defined with a time we add it to timeIntervals.
            if (timeAtPixelInScds) {
              const timeAtPixelInMilliscds = timeAtPixelInScds * 1000;
              const timeFrac = Math.max(
                (timeAtPixelInMilliscds - startTime) / (endTime - startTime),
                0,
              );

              timeIntervals.push([timeAtPixelInMilliscds, timeFrac, null, k]);
              if (delay) {
                const afterStopTimeInMilliscds =
                  (timeAtPixelInScds + delay) * 1000;
                timeIntervals.push([
                  afterStopTimeInMilliscds,
                  (afterStopTimeInMilliscds - startTime) /
                    (endTime - startTime),
                  null,
                  k,
                ]);
              }
            }
          }
        }

        if (coords.length) {
          const geometry = new LineString(coords);
          console.log(textColors[type]);
          // For debug purpose , display the trajectory
          // this.olLayer.getSource().addFeatures([new Feature(geometry)]);
          trajectories.push({
            id,
            type,
            name,
            color: (color && `#${color}`) || bgColors[type],
            textColor: textColors[type],
            geom: geometry,
            timeOffset: this.currentOffset,
            time_intervals: timeIntervals,
          });
        }
      }
      this.tracker.setTrajectories(trajectories);
    });
  }
}

export default TrackerLayer;
