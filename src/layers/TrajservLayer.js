import LineString from 'ol/geom/LineString';
import qs from 'query-string';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import TrackerLayer from './TrackerLayer';

const TRAIN_FILTER = 'train_filter';
const OPERATOR_FILTER = 'operator_filter';

/**
 * Responsible for loading tracker data from Trajserv.
 */
class TrajservLayer extends TrackerLayer {
  /**
   *  Translate the response date object into a readable object.
   */
  static translateDates(dates) {
    const newDates = [];

    for (let i = 0; i < dates.length; i += 1) {
      const { d: day, m: month, y: year } = dates[i];
      newDates.push({
        day,
        month,
        year,
      });
    }
    return newDates;
  }

  /**
   *  Translate the response into a readable object.
   */
  static translateTrajStationsResp(resp) {
    const stations = [];
    for (let i = 0; i < resp.sts.length; i += 1) {
      const {
        sid: stationId,
        n: stationName,
        p: coordinates,
        at: arrivalTime,
        dt: departureTime,
        ap: arrivalDate,
        dp: departureDate,
        ad: arrivalDelay,
        dd: departureDelay,
        dot: noDropOff,
        put: noPickUp,
        c: skipped,
        wa: wheelchairAccessible,
      } = resp.sts[i];

      stations.push({
        stationId,
        stationName,
        coordinates,
        arrivalTime,
        departureTime,
        arrivalDate,
        departureDate,
        arrivalDelay,
        departureDelay,
        noDropOff,
        noPickUp,
        skipped,
        wheelchairAccessible,
      });
    }

    const { n: operator, u: operatorUrl, tz: operatorTimeZone } = resp.a;

    const notOperatingDays = TrajservLayer.translateDates(resp.tt.n);
    const additionalOperatingDays = TrajservLayer.translateDates(resp.tt.p);
    const { t: operatingPeriod } = resp.tt;

    const {
      id,
      hs: destination,
      t: vehiculeType,
      ln: longName,
      sn: shortName,
      wa: wheelchairAccessible,
      ba: bicyclesAllowed,
      rt: realTime,
      fid: feedsId,
    } = resp;

    const backgroundColor = resp.c && `#${resp.c}`;
    const color = resp.tc && `#${resp.tc}`;

    return {
      id,
      destination,
      backgroundColor,
      color,
      vehiculeType,
      longName,
      shortName,
      stations,
      wheelchairAccessible,
      bicyclesAllowed,
      realTime,
      feedsId,
      operatingInformations: {
        operatingPeriod,
        notOperatingDays,
        additionalOperatingDays,
      },
      operator,
      operatorUrl,
      operatorTimeZone,
    };
  }

  static createFilter(train, operator) {
    const filterList = [];

    if (train) {
      const trainList = typeof train === 'string' ? [train] : train;
      const trainFilter = t => trainList.indexOf(t.name) !== -1;
      filterList.push(trainFilter);
    }

    if (operator) {
      const operatorList = typeof operator === 'string' ? [operator] : operator;
      const operatorFilter = t =>
        operatorList.filter(op => t.operator.includes(op)).length;
      filterList.push(operatorFilter);
    }

    return t => {
      for (let i = 0; i < filterList.length; i += 1) {
        if (!filterList[i](t)) {
          return false;
        }
      }
      return true;
    };
  }

  constructor(options = {}) {
    super({ ...options });

    this.url = options.url || 'https://api.geops.io/tracker';

    this.filterFc =
      options.train || options.operator
        ? TrajservLayer.createFilter(options.train, options.operator)
        : null;
  }

  init(map) {
    super.init(map);

    // Setting filters from the permalink.
    const parameters = { ...qs.parse(window.location.search) };
    if (parameters[TRAIN_FILTER] || parameters[OPERATOR_FILTER]) {
      const trainFilter = parameters[TRAIN_FILTER].split(',');
      const operatorFilter = parameters[OPERATOR_FILTER].split(',');

      this.filterFc = TrajservLayer.createFilter(trainFilter, operatorFilter);
    }

    if (this.filterFc) {
      this.tracker.setFilter(this.filterFc);
    }

    this.map.on('singleclick', e => {
      if (!this.clickCallbacks.length) {
        return;
      }

      const vehicle = this.getVehicleAtCoordinate(e.coordinate);
      const features = [];

      if (vehicle) {
        const geom = vehicle.coordinate ? new Point(vehicle.coordinate) : null;
        features.push(new Feature({ geometry: geom, ...vehicle }));

        if (features.length) {
          const featId = features[0].get('id');
          this.fetchTrajectory(featId).then(r => {
            this.clickCallbacks.forEach(c => c(r, this, e));
          });
        }
      }
    });
  }

  fetchTrajectory(trajId) {
    const params = this.getUrlParams({
      id: trajId,
      time: TrackerLayer.getTimeString(new Date()),
    });

    const url = `${this.url}/trajstations?${params}`;
    return fetch(url)
      .then(res => {
        return res.json();
      })
      .then(resp => TrajservLayer.translateTrajStationsResp(resp));
  }

  fetchTrajectories() {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;
    const trackerUrl = `${this.url}/trajectories?${this.getUrlParams({
      attr_det: 1,
    })}`;
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
        const {
          i: id,
          p: paths,
          t: type,
          n: name,
          c: color,
          ag: operator,
        } = data.a[i];

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
          // For debug purpose , display the trajectory
          // this.olLayer.getSource().addFeatures([new Feature(geometry)]);
          trajectories.push({
            id,
            type,
            name,
            color: color && `#${color}`,
            geom: geometry,
            timeOffset: this.currentOffset,
            time_intervals: timeIntervals,
            operator: operator.n,
          });
        }
      }
      this.tracker.setTrajectories(trajectories);
    });
  }
}

export default TrajservLayer;
