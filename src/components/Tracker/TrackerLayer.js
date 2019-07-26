import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'react-spatial/layers/VectorLayer';
import LineString from 'ol/geom/LineString';
import { Style, Icon } from 'ol/style';
import { buffer, getWidth, containsCoordinate } from 'ol/extent';
import Tracker from './Tracker';
import { getRadius, bgColors, textColors } from '../../config/tracker';

/**
 * Class for Tracker layer.
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

    this.url = options.url || 'https://backend1.tracker.geops.de/trajectories';

    this.styleCache = {};

    this.currentOffset = 0;

    this.requestIntervalSeconds = 10;

    this.intervalStarted = false;

    this.hoverFeatureId = null;
  }

  startInterval() {
    window.clearInterval(this.updateInterval);
    this.updateInterval = window.setInterval(() => {
      this.showTrajectories();
    }, (this.requestIntervalSeconds - 1) * 1000);
  }

  getFeatureAtCoordinate(coordinate) {
    const res = this.map.getView().getResolution();
    const ext = buffer([...coordinate, ...coordinate], 10 * res);
    const features = this.tracker.getPointFeatures();

    for (let i = 0; i < features.length; i += 1) {
      const featureCoord = features[i].getGeometry().getCoordinates();
      if (containsCoordinate(ext, featureCoord)) {
        return features[i];
      }
    }

    return null;
  }

  init(map) {
    super.init(map);

    this.tracker = new Tracker(map, {
      layer: this.olLayer,
    });

    this.tracker.reload();

    this.map.on('moveend', () => {
      const z = this.map.getView().getZoom();

      if (z !== this.currentZoom) {
        this.currentZoom = z;
        this.styleCache = {};
      }
      this.showTrajectories();
    });

    this.map.on('pointermove', e => {
      const feature = this.getFeatureAtCoordinate(e.coordinate);

      this.map.getTarget().style.cursor = feature ? 'pointer' : 'auto';
      this.hoverFeatureId = feature ? feature.get('id') : null;
    });

    this.map.on('singleclick', e => {
      const feature = this.getFeatureAtCoordinate(e.coordinate);
      this.clickCallbacks.forEach(c => c(feature ? [feature] : [], this, e));
    });

    this.showTrajectories();
    this.startInterval();
    this.tracker.setStyle((props, r) => this.style(props, r));
  }

  style(feature) {
    const props = feature.getProperties();
    const { type, name, id } = props;
    const z = Math.min(Math.floor(this.currentZoom || 1), 16);
    const hover = this.hoverFeatureId === id;

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

      const img = new Image();
      img.src = c.toDataURL();

      this.styleCache[z][type][name][hover] = new Style({
        image: new Icon({
          snapToPixel: false,
          anchor: [0.5, 0.5],
          imgSize: [c.width, c.height],
          img,
        }),
      });
    }

    return this.styleCache[z][type][name][hover];
  }

  fetchTrajectories() {
    const ext = this.map.getView().calculateExtent();
    const bufferExt = buffer(ext, getWidth(ext) / 10);
    const now = new Date();
    const later = new Date();
    later.setSeconds(later.getSeconds() + this.requestIntervalSeconds);

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
    };

    if (this.lastRequestTime) {
      // urlParams.diff = Date.now() / 1000;
    }

    const getParams = Object.keys(urlParams)
      .map(k => `${k}=${urlParams[k]}`)
      .join('&');

    const trackerUrl = `${this.url}?${getParams}`;

    this.lastRequestTime = btime;
    return fetch(trackerUrl).then(data => data.json());
  }

  showTrajectories() {
    this.fetchTrajectories().then(data => {
      this.currentOffset = data.o || 0;
      const trajectories = [];

      for (let i = 0; i < data.a.length; i += 1) {
        const coords = [];
        const timeIntervals = [];
        const path = data.a[i].p;

        for (let j = 0; j < path.length; j += 1) {
          const startTime = path[j][0].a || data.t;
          const endTime = path[j][path[j].length - 1].a || data.t + 20;

          for (let k = 0; k < path[j].length; k += 1) {
            const px = [path[j][k].x, path[j][k].y];
            coords.push(this.map.getCoordinateFromPixel(px));

            /**
            if (k !== 0 && k !== path[j].length - 1) {
              // add indermediate time intervals
              const tFrac = k / path[j].length;
              const time =
                path[j][k].a || startTime + (endTime - startTime * tFrac);

              timeIntervals.push([time * 1000, tFrac, null]);
            }
            */
          }

          timeIntervals.unshift([startTime * 1000, 0, null]);
          timeIntervals.push([endTime * 1000, 1, null]);
        }

        if (coords.length && timeIntervals.length) {
          const geometry = new LineString(coords);
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
      this.olLayer.changed();
    });
  }
}

export default TrackerLayer;
