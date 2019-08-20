import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Layer from 'react-spatial/Layer';
import { buffer, containsCoordinate, getWidth } from 'ol/extent';
import Tracker from './Tracker';
import { getRadius, bgColors, textColors, timeSteps } from '../config/tracker';

/**
 * Trackerlayer.
 * Responsible for loading tracker data.
 */
class TrackerLayer extends Layer {
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

    this.clickCallbacks = [];

    // Add click callback
    if (options.onClick) {
      this.onClick(options.onClick);
    }
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

  onClick(callback) {
    if (typeof callback === 'function') {
      this.clickCallbacks.push(callback);
    } else {
      throw new Error('callback must be of type function.');
    }
  }

  getUrlParams(extraParams = {}) {
    const ext = this.map.getView().calculateExtent();
    const bbox = buffer(ext, getWidth(ext) / 10).join(',');
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
      bbox,
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
      key: '5cc87b12d7c5370001c1d6551c1d597442444f8f8adc27fefe2f6b93',

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
}

export default TrackerLayer;
