import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'react-spatial/layers/VectorLayer';
import LineString from 'ol/geom/LineString';
import { Style, Icon } from 'ol/style';
import { buffer, getWidth } from 'ol/extent';
import Tracker from './Tracker';
import { getRadius } from '../../config/tracker';

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
        style: (f, r) => this.style(f, r),
        source: new VectorSource(),
      }),
      ...options,
    });

    this.url = options.url || 'https://backend1.tracker.geops.de/trajectories';

    this.styleCache = {};

    this.currentOffset = 0;

    this.requestIntervalSeconds = 10;

    this.intervalStarted = false;
  }

  startInterval() {
    window.clearInterval(this.updateInterval);
    this.updateInterval = window.setInterval(() => {
      this.showTrajectories();
    }, (this.requestIntervalSeconds - 1) * 1000);
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

      window.clearTimeout(this.moveTimeout);
      this.moveTimeout = window.setTimeout(() => this.showTrajectories(), 1000);
    });

    this.showTrajectories();
    this.startInterval();
    this.tracker.setStyle(f => this.style(f));
  }

  style(f) {
    const type = f.get('type');
    const name = f.get('name');
    const z = this.currentZoom || 1;
    this.styleCache[z] = this.styleCache[z] || {};

    if (!this.styleCache[z][name]) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const rad = Math.max(2, getRadius(type, z)) + 5;
      canvas.width = rad * 2 + 4;
      canvas.height = rad * 2 + 4;

      ctx.beginPath();
      ctx.arc(rad + 2, rad + 2, rad, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'red';
      ctx.fill();

      if (rad > 8) {
        const textSize = Math.max(10, rad);
        ctx.lineWidth = 1;
        ctx.font = `100 ${textSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.strokeText(
          f.get('name'),
          canvas.width / 2,
          (canvas.height + textSize - 3) / 2,
        );
      }

      const img = new Image();
      img.src = canvas.toDataURL();

      this.styleCache[z][name] = new Style({
        image: new Icon({
          snapToPixel: false,
          img,
          imgSize: [canvas.width, canvas.height],
        }),
      });
    }

    return this.styleCache[z][name];
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
      this.tracker.clear();
      this.currentOffset = data.o || 0;

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

          this.tracker.addTrajectory(data.a[i].i, {
            id: data.a[i].i,
            geom: geometry,
            timeOffset: this.currentOffset,
            time_intervals: timeIntervals,
          });
        }
      }

      this.olLayer.changed();
    });
  }
}

export default TrackerLayer;
