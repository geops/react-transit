import { unByKey } from 'ol/Observable';
import qs from 'query-string';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { buffer, getWidth } from 'ol/extent';
import { LineString } from 'ol/geom';
import TrackerLayer from './TrackerLayer';

const TRAIN_FILTER = 'train_filter';
const OPERATOR_FILTER = 'operator_filter';

/**
 * Responsible for loading tracker data from Trajserv.
 * @class
 * @param {Object} options
 * @inheritDoc
 */
class TrajservLayer extends TrackerLayer {
  /**
   *  Translate the response date object into a readable object.
   * @returns {array<Date>}
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
   * @returns {Object} returns a readable object
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

    if (!train && !operator) {
      return null;
    }

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
    this.filterFc = TrajservLayer.createFilter(options.train, options.operator);
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol.map} map ol.map (https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html)
   */
  init(map) {
    super.init(map);

    // Setting filters from the permalink.
    const parameters = qs.parse(window.location.search);
    const trainParam = parameters[TRAIN_FILTER];
    const opParam = parameters[OPERATOR_FILTER];
    if (trainParam || opParam) {
      this.filterFc = TrajservLayer.createFilter(
        trainParam.split(','),
        opParam.split(','),
      );
    }
    this.tracker.setFilter(this.filterFc);

    this.onSingleClickRef = this.map.on('singleclick', e => {
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

  /**
   * Destroy the layer.
   *
   */
  destroy() {
    super.destroy();
    unByKey(this.onSingleClickRef);
  }

  /**
   * Fetch specific trajectory by ID
   * @param {number} trajId the ID of the trajectory
   */
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

  /**
   * Returns the URL Parameters
   * @param {Object} extraParams
   * @returns {Object}
   */
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

    const params = {
      ...extraParams,
      bbox,
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

  /**
   * Update the trajectories
   */
  updateTrajectories() {
    if (this.getVisible()) {
      this.fetchTrajectories(
        `${this.url}/trajectory_collection?${this.getUrlParams({
          attr_det: 1,
        })}`,
      ).then(data => {
        // For debug purpose , display the trajectory
        // this.olLayer.getSource().clear();
        const trajectories = [];
        for (let i = 0; i < data.features.length; i += 1) {
          const traj = data.features[i];
          const {
            ID: id,
            ProductIdentifier: type,
            PublishedLineName: name,
            Operator: operator,
            TimeIntervals: timeIntervals,
            Color: color,
            TextColor: textColor,
            Delay: delay,
          } = traj.properties;

          trajectories.push({
            id,
            type,
            name,
            color: color && `#${color}`,
            textColor: textColor && `#${textColor}`,
            delay,
            operator,
            timeIntervals,
            geometry: new LineString(traj.geometry.coordinates),
          });
        }
        this.tracker.setTrajectories(trajectories);
      });
    }
  }
}

export default TrajservLayer;
