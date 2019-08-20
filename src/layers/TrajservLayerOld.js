import LineString from 'ol/geom/LineString';
import { buffer, getWidth } from 'ol/extent';
import TrajservLayer from './TrajservLayer';
import TrackerLayer from './TrackerLayer';

/**
 * Responsible for loading tracker data from Trajserv.
 */
class TrajservLayerOld extends TrajservLayer {
  constructor(options = {}) {
    super({ ...options });
  }

  /**
   * Returns the URL Parameters
   * @param {Object} extraParams
   * @returns {Object}
   */
  getUrlParams(extraParams = {}) {
    const ext = this.map.getView().calculateExtent();
    const bufferExt = buffer(ext, getWidth(ext) / 10);
    const bbox = bufferExt.join(',');
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

    const params = {
      ...extraParams,
      bbox,
      swy: bufferExt[0],
      swx: bufferExt[1],
      nex: bufferExt[3],
      ney: bufferExt[2],
      orx: ext[0],
      ory: ext[3],
      btime: TrackerLayer.getTimeString(now),
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

  updateTrajectories() {
    this.fetchTrajectories(
      `${this.url}/trajectories?${this.getUrlParams({
        attr_det: 1,
      })}`,
    ).then(data => {
      this.lastRequestTime = data.t;
      this.currentOffset = data.o || 0;
      const trajectories = [];

      for (let i = 0; i < data.a.length; i += 1) {
        const coords = [];
        const timeIntervals = [];
        let delay = 0;
        const {
          i: id,
          p: paths,
          t: type,
          n: name,
          c: color,
          d: textColor,
          ag: operator,
          r: realTimeAvailable,
        } = data.a[i];

        for (let j = 0; j < paths.length; j += 1) {
          const path = paths[j];
          const startTime = (path[0].a || data.t) * 1000;
          const endTime = (path[path.length - 1].a || data.t + 20) * 1000;

          for (let k = 0; k < path.length; k += 1) {
            const {
              x,
              y,
              a: timeAtPixelInScds,
              d: delayAtStation,
              ad: arrivalDelay,
            } = path[k];
            if (/backend1/.test(this.url)) {
              const coord = this.map.getCoordinateFromPixel([x, y]);
              coords.push(coord);
            } else {
              coords.push([x, y]);
            }

            // If a pixel is defined with a time we add it to timeIntervals.
            if (timeAtPixelInScds) {
              const timeAtPixelInMilliscds = timeAtPixelInScds * 1000;
              const timeFrac = Math.max(
                (timeAtPixelInMilliscds - startTime) / (endTime - startTime),
                0,
              );

              timeIntervals.push([timeAtPixelInMilliscds, timeFrac, k]);
              if (delayAtStation) {
                // We add a time interval when the train is stopped at a station.
                const afterStopTimeInMilliscds =
                  (timeAtPixelInScds + delayAtStation) * 1000;
                timeIntervals.push([
                  afterStopTimeInMilliscds,
                  (afterStopTimeInMilliscds - startTime) /
                    (endTime - startTime),
                  k,
                ]);
              }
              if (realTimeAvailable && arrivalDelay && arrivalDelay >= 0) {
                delay = arrivalDelay;
              }
            }
          }
        }

        if (coords.length) {
          const geometry = new LineString(coords);
          trajectories.push({
            id,
            type,
            name,
            color: color && `#${color}`,
            textColor: textColor && `#${textColor}`,
            delay,
            timeOffset: this.currentOffset,
            timeIntervals,
            operator: operator && operator.n,
            geometry,
          });
        }
      }
      this.tracker.setTrajectories(trajectories);
    });
  }
}

export default TrajservLayerOld;
