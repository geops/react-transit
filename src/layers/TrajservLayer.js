import { unByKey } from 'ol/Observable';
import qs from 'query-string';
import Feature from 'ol/Feature';
import { transform as transformCoords } from 'ol/proj';
import { buffer, getWidth } from 'ol/extent';
import { Point, MultiPoint, LineString } from 'ol/geom';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import TrackerLayer from './TrackerLayer';
import {
  getRadius,
  getBgColor,
  getDelayColor,
  getDelayText,
  getTextColor,
  getTextSize,
} from '../config/tracker';

const LINE_FILTER = 'publishedlinename';
const ROUTE_FILTER = 'tripnumber';
const OPERATOR_FILTER = 'operator';

/**
 * Responsible for loading tracker data from Trajserv.
 * @class
 * @param {Object} [options]
 * @inheritDoc
 */
class TrajservLayer extends TrackerLayer {
  /**
   *  Translate the response date object into a readable object.
   * @returns {array<Date>}
   * @private
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
   * @private
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
        c: cancelled,
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
        cancelled,
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
      t: vehicleType,
      ln: longName,
      sn: shortName,
      wa: wheelchairAccessible,
      ba: bicyclesAllowed,
      rt: realTime,
      fid: feedsId,
      rid: routeIdentifier,
    } = resp;

    const backgroundColor = resp.c && `#${resp.c}`;
    const color = resp.tc && `#${resp.tc}`;

    return {
      id,
      destination,
      backgroundColor,
      color,
      vehicleType,
      routeIdentifier,
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

  /**
   * Create a filter based on train and operator
   * @param {string} line
   * @param {string} route
   * @param {string} operator
   * @private
   */
  static createFilter(line, trip, operator, regexLine) {
    const filterList = [];

    if (!line && !trip && !operator && !regexLine) {
      return null;
    }

    if (regexLine) {
      // regexLine has higher prio over line filter
      const regexLineList =
        typeof regexLine === 'string' ? [regexLine] : regexLine;
      const lineFilter = t =>
        regexLineList.some(tr => new RegExp(tr, 'i').test(t.name));
      filterList.push(lineFilter);
    }

    if (line && !regexLine) {
      const lineFiltersList = typeof line === 'string' ? line.split(',') : line;
      const lineList = lineFiltersList.map(l =>
        l.replace(/\s+/g, '').toUpperCase(),
      );
      const lineFilter = l => {
        return lineList.some(filter => filter === l.name.toUpperCase());
      };
      filterList.push(lineFilter);
    }

    if (trip) {
      const tripFilters = typeof trip === 'string' ? trip.split(',') : trip;
      const tripList = tripFilters.map(rt => parseInt(rt, 10));
      const tripFilter = t => {
        const tripId = parseInt(t.routeIdentifier.split('.')[0], 10);
        return tripList.some(tr => tr === tripId);
      };
      filterList.push(tripFilter);
    }

    if (operator) {
      const operatorList = typeof operator === 'string' ? [operator] : operator;
      const operatorFilter = t =>
        operatorList.some(op => new RegExp(op, 'i').test(t.operator));
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
    this.showVehicleTraj =
      options.showVehicleTraj !== undefined ? options.showVehicleTraj : true;
    this.apiKey = options.apiKey;
    this.filterFc = TrajservLayer.createFilter(
      options.publishedLineName,
      options.tripNumber,
      options.operator,
      options.regexPublishedLineName,
    );
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol.map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map)
   * @private
   */
  init(map) {
    super.init(map);

    if (!this.map) {
      return;
    }

    // Setting filters from the permalink.
    const parameters = qs.parse(window.location.search.toLowerCase());
    const lineParam = parameters[LINE_FILTER];
    const routeParam = parameters[ROUTE_FILTER];
    const opParam = parameters[OPERATOR_FILTER];

    if (lineParam || routeParam || opParam) {
      this.filterFc = TrajservLayer.createFilter(
        lineParam ? lineParam.split(',') : undefined,
        routeParam ? routeParam.split(',') : undefined,
        opParam ? opParam.split(',') : undefined,
      );
    }

    if (this.tracker && this.filterFc) {
      this.tracker.setFilter(this.filterFc);
    }

    // Sort the trajectories.
    if (this.tracker && this.sortFc) {
      this.tracker.setSort(this.sortFc);
    } else if (this.tracker && this.useDelayStyle) {
      // Automatic sorting depending on delay, higher delay on top.
      this.tracker.setSort((a, b) => {
        if (a.delay === null) return 1;
        return a.delay < b.delay ? 1 : -1;
      });
    }
  }

  start() {
    if (!this.map) {
      return;
    }
    super.start(this.map);

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
          this.selectedVehicleId = features[0].get('id');
          this.journeyId = features[0].get('journeyIdentifier');
          this.fetchTrajectoryStations(this.selectedVehicleId).then(r => {
            this.clickCallbacks.forEach(c => c(r, this, e));
          });
        }
      } else {
        this.selectedVehicleId = null;
        this.olLayer.getSource().clear();
        this.clickCallbacks.forEach(c => c(null, this, e));
      }
    });

    this.onResolutionChangeRef = this.map
      .getView()
      .on('change:resolution', () => {
        if (this.selectedVehicleId && this.journeyId) {
          this.highlightTrajectory();
        }
      });
  }

  stop() {
    unByKey(this.onSingleClickRef);
    unByKey(this.onResolutionChangeRef);
    this.journeyId = null;
    super.stop();
  }

  /**
   * Draw the trajectory as a line with points for each stop.
   * @param {Array} stationsCoords Array of station coordinates.
   * @param {Array} lineCoords Array of coordinates of the trajectory (linestring).
   * @param {string} color The color of the line.
   * @private
   */
  drawTrajectory(stationsCoords, lineCoords, color) {
    // Don't allow white lines, use red instead.
    const vehiculeColor = /#ffffff/i.test(color) ? '#ff0000' : color;

    const abovePointFeatures = new Feature({
      geometry: new MultiPoint(stationsCoords),
    });
    abovePointFeatures.setStyle(
      new Style({
        zIndex: 4,
        image: new Circle({
          radius: 4,
          fill: new Fill({
            color: this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
          }),
        }),
      }),
    );

    const belowPointFeatures = new Feature({
      geometry: new MultiPoint(stationsCoords),
    });
    belowPointFeatures.setStyle(
      new Style({
        zIndex: 1,
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: '#000000',
          }),
        }),
      }),
    );

    const lineFeat = new Feature({
      geometry: new LineString(lineCoords),
    });
    lineFeat.setStyle([
      new Style({
        zIndex: 3,
        stroke: new Stroke({
          color: this.useDelayStyle ? '#a0a0a0' : vehiculeColor,
          width: 4,
        }),
      }),
      new Style({
        zIndex: 2,
        stroke: new Stroke({
          color: '#000000',
          width: 6,
        }),
      }),
    ]);

    const vectorSource = this.olLayer.getSource();
    vectorSource.clear();
    vectorSource.addFeatures([
      abovePointFeatures,
      lineFeat,
      belowPointFeatures,
    ]);
  }

  /**
   * Fetch stations information with a trajectory ID
   * @param {number} trajId the ID of the trajectory
   * @private
   */
  fetchTrajectoryStations(trajId) {
    const params = this.getUrlParams({
      id: trajId,
      time: TrackerLayer.getTimeString(new Date()),
    });

    const url = `${this.url}/trajstations?${params}`;
    return fetch(url)
      .then(res => {
        return res.json();
      })
      .then(resp => {
        const trajStations = TrajservLayer.translateTrajStationsResp(resp);

        this.stationsCoords = [];
        trajStations.stations.forEach(station => {
          this.stationsCoords.push(
            transformCoords(station.coordinates, 'EPSG:4326', 'EPSG:3857'),
          );
        });

        this.highlightTrajectory();
        return trajStations;
      });
  }

  highlightTrajectory() {
    this.abortHighlightTrajectory();
    this.abortControllerHighlight = new AbortController();
    const { signal } = this.abortControllerHighlight;
    this.fetchTrajectoryById(this.journeyId, { signal }).then(traj => {
      if (traj) {
        const { p, t, c } = traj;

        const lineCoords = [];
        p[0].forEach(point => {
          lineCoords.push([point.x, point.y]);
        });
        this.drawTrajectory(
          this.stationsCoords,
          lineCoords,
          c ? `#${c}` : getBgColor(t),
        );
      }
    });
  }

  abortHighlightTrajectory() {
    if (this.abortControllerHighlight) {
      this.abortControllerHighlight.abort();
    }
  }

  /**
   * Fetch trajectory information with a trajectory ID
   * @param {number} journeyId the gtfs ID of the trajectory.
   * @private
   */
  fetchTrajectoryById(journeyId) {
    const params = this.getUrlParams(
      {
        id: journeyId,
        time: TrackerLayer.getTimeString(new Date()),
      },
      false,
    );
    const url = `${this.url}/trajectorybyid?${params}`;

    this.abortFetchTrajectoryById();
    this.abortControllerFetchById = new AbortController();
    const { signal } = this.abortControllerFetchById;
    return fetch(url, { signal })
      .then(res => {
        return res.json();
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.warn('Fetch trajectory by id request failed: ', err);
      });
  }

  abortFetchTrajectoryById() {
    if (this.abortControllerFetchById) {
      this.abortControllerFetchById.abort();
    }
  }

  /**
   * Returns the URL Parameters
   * @param {Object} extraParams
   * @returns {Object}
   * @private
   */
  getUrlParams(extraParams = {}, useBbox = true) {
    const intervalMs = this.speed * 20000; // 20 seconds, arbitrary value, could be : (this.requestIntervalSeconds + 1) * 1000;
    const now = this.currTime;

    let diff = true;

    if (
      this.later &&
      now.getTime() > this.later.getTime() - 3000 * this.speed
    ) {
      diff = false;
    }
    if (
      !this.later ||
      !diff ||
      this.later.getTime() - now.getTime() > intervalMs
    ) {
      const later = new Date(now.getTime() + intervalMs);
      this.later = later;
    }

    const params = {
      ...extraParams,
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
      key: this.apiKey,
      // toff: this.currTime.getTime() / 1000,
    };

    if (useBbox) {
      const ext = this.map.getView().calculateExtent();
      params.bbox = buffer(ext, getWidth(ext) / 10).join(',');
    }

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
   * @private
   */
  updateTrajectories() {
    this.fetchTrajectories(
      `${this.url}/trajectory_collection?${this.getUrlParams({
        attr_det: 1,
      })}`,
    ).then(data => {
      if (!data) {
        return;
      }
      const trajectories = [];
      for (let i = 0; i < data.features.length; i += 1) {
        const traj = data.features[i];
        const geometry = new LineString(traj.geometry.coordinates);
        const {
          ID: id,
          ProductIdentifier: type,
          JourneyIdentifier: journeyIdentifier,
          PublishedLineName: name,
          RouteIdentifier: routeIdentifier,
          Operator: operator,
          TimeIntervals: timeIntervals,
          Color: color,
          TextColor: textColor,
          Delay: delay,
          Cancelled: cancelled,
        } = traj.properties;

        trajectories.push({
          id,
          type,
          name,
          color: color && `#${color}`,
          textColor: textColor && `#${textColor}`,
          delay,
          operator,
          journeyIdentifier,
          routeIdentifier,
          timeIntervals,
          geometry,
          cancelled,
        });
      }
      this.tracker.setTrajectories(trajectories);
    });
  }

  /**
   * Define the style of the vehicle.
   *
   * @param {Object} props Properties
   * @private
   */
  style(props) {
    const { type, name, id, color, textColor, delay, cancelled } = props;
    const z = Math.min(Math.floor(this.currentZoom || 1), 16);
    const hover = this.hoverVehicleId === id;
    const selected = this.selectedVehicleId === id;

    this.styleCache[z] = this.styleCache[z] || {};
    this.styleCache[z][type] = this.styleCache[z][type] || {};
    this.styleCache[z][type][name] = this.styleCache[z][type][name] || {};
    this.styleCache[z][type][name][delay] =
      this.styleCache[z][type][name][delay] || {};
    this.styleCache[z][type][name][delay][hover] =
      this.styleCache[z][type][name][delay][hover] || {};

    if (!this.styleCache[z][type][name][delay][hover][selected]) {
      let radius = getRadius(type, z);
      if (hover || selected) {
        radius += 5;
      }
      const margin = 1;
      const radiusDelay = radius + 2;
      const origin = radiusDelay + margin;

      const canvas = document.createElement('canvas');
      canvas.width = radiusDelay * 2 + margin * 2 + 100;
      canvas.height = radiusDelay * 2 + margin * 2;
      const ctx = canvas.getContext('2d');

      if (delay !== null) {
        // Draw delay background
        ctx.save();
        ctx.beginPath();
        ctx.arc(origin, origin, radiusDelay, 0, 2 * Math.PI, false);
        ctx.fillStyle = getDelayColor(delay, cancelled);
        ctx.filter = 'blur(1px)';
        ctx.fill();
        ctx.restore();
      }

      if (hover) {
        // Draw delay text
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.max(
          14,
          Math.min(17, radius * 1.2),
        )}px arial, sans-serif`;
        ctx.fillStyle = getDelayColor(delay, cancelled);

        ctx.strokeStyle = this.delayOutlineColor;
        ctx.lineWidth = 1.5;
        ctx.strokeText(getDelayText(delay, cancelled), origin * 2, origin);
        ctx.fillText(getDelayText(delay, cancelled), origin * 2, origin);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(origin, origin, radius, 0, 2 * Math.PI, false);
      if (!this.useDelayStyle) {
        ctx.fillStyle = color || getBgColor(type);
        ctx.fill();
      } else {
        ctx.fillStyle = getDelayColor(delay, cancelled);
        ctx.fill();
      }

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      const markerSize = radius * 2;
      if (radius > 10) {
        const shortname =
          type === 'Rail' && name.length > 3 ? name.substring(0, 2) : name;
        const fontSize = Math.max(radius, 10);
        const textSize = getTextSize(ctx, markerSize, shortname, fontSize);

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = !this.useDelayStyle
          ? textColor || getTextColor(type)
          : '#000000';
        ctx.font = `bold ${textSize}px Arial`;

        ctx.fillText(shortname, origin, origin);
      }
      this.styleCache[z][type][name][delay][hover][selected] = canvas;
    }

    return this.styleCache[z][type][name][delay][hover][selected];
  }
}

export default TrajservLayer;
