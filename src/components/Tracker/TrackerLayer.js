import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'react-spatial/layers/VectorLayer';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';
import { buffer, containsCoordinate, getWidth } from 'ol/extent';
import Tracker from './Tracker';
import { getRadius, bgColors, textColors } from '../../config/tracker';

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
      'https://backend1.tracker.geops.de/trajectories' ||
      'https://tracker.geops.io/trajectories';

    this.styleCache = {};

    this.currentOffset = 0;

    this.requestIntervalSeconds = 3;

    this.intervalStarted = false;

    this.hoverVehicleId = null;

    this.startTime = new Date();

    this.currTime = this.startTime;

    this.speed = 1;
  }

  startInterval() {
    window.clearInterval(this.updateInterval);
    this.updateInterval = window.setInterval(() => {
      this.updateTrajectories();
    }, this.requestIntervalSeconds * 1000);
  }

  getCurrTime() {
    return this.currTime;
  }

  setCurrTime(time) {
    this.tracker.setCurrTime(new Date(time));
    this.currTime = time;
  }

  getStartTime() {
    return this.startTime;
  }

  setStartTime(time) {
    this.startTime = time;
  }

  getSpeed() {
    return this.speed;
  }

  setSpeed(speed) {
    this.tracker.setSpeed(speed);
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

    this.tracker = new Tracker(map, {
      canvas: this.canvas,
    });

    this.map.on('moveend', () => {
      const z = this.map.getView().getZoom();

      if (z !== this.currentZoom) {
        this.currentZoom = z;
        this.styleCache = {};
      }

      // this.updateTrajectories();
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
    this.tracker.setStyle((props, r) => this.style(props, r));
  }

  style(props) {
    const { type, name, id } = props;
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
      ctx.fillStyle = bgColors[type];
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

  fetchTrajectories() {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const ext = this.map.getView().calculateExtent();
    const bufferExt = buffer(ext, getWidth(ext) / 10);
    const now = this.currTime;
    const later = new Date(now);
    later.setSeconds(
      later.getSeconds() + this.requestIntervalSeconds * this.speed * 2,
    );

    const btime = [
      now.getHours() - 2,
      now.getMinutes(),
      `${now.getSeconds()}.${now.getMilliseconds()}`,
    ].join(':');

    const urlParams = {
      swy: bufferExt[0],
      swx: bufferExt[1], // EPSG:brosi
      nex: bufferExt[3],
      ney: bufferExt[2],
      orx: ext[0],
      ory: ext[3],
      btime,
      etime: [
        later.getHours() - 2,
        later.getMinutes(),
        `${later.getSeconds()}.${later.getMilliseconds()}`,
      ].join(':'),
      date: TrackerLayer.getDateString(now),
      rid: 1,
      a: 1,
      cd: 1,
      nm: 1,
      fl: 1,
      s: 0,
      z: this.map.getView().getZoom(),
      // toff: this.currTime.getTime() / 1000,
    };

    if (this.lastRequestTime) {
      // urlParams.diff = Date.now() / 1000;
    }

    const getParams = Object.keys(urlParams)
      .map(k => `${k}=${urlParams[k]}`)
      .join('&');

    const trackerUrl = `${this.url}?${getParams}`;

    this.lastRequestTime = btime;
    return fetch(trackerUrl, { signal }).then(data => data.json());
  }

  updateTrajectories() {
    this.startUpdateTime = new Date();
    this.olLayer.getSource().clear();
    this.fetchTrajectories().then(data => {
      this.currentOffset = data.o || 0;
      const trajectories = [];

      for (let i = 0; i < data.a.length; i += 1) {
        const coords = [];
        const timeIntervals = [];
        const paths = data.a[i].p;

        for (let j = 0; j < paths.length; j += 1) {
          const path = paths[j];
          const startTime = path[0].a || data.t;
          const endTime = path[path.length - 1].a || data.t + 20;

          timeIntervals.unshift([startTime * 1000, 0, null]);
          timeIntervals.push([endTime * 1000, 1, null]);

          for (let k = 0; k < path.length; k += 1) {
            const px = [path[k].x, path[k].y];
            coords.push(this.map.getCoordinateFromPixel(px));
          }
        }

        if (coords.length && timeIntervals.length) {
          const geometry = new LineString(coords);
          // this.olLayer.getSource().addFeatures([new Feature(geometry)]);
          trajectories.push({
            id: data.a[i].i,
            type: data.a[i].t,
            name: data.a[i].n,
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
