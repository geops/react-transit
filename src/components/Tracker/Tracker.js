import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Circle } from 'ol/style';
import { getCenter, containsCoordinate } from 'ol/extent';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';

/**
 * Tracker for OpenLayers.
 */
export default class Tracker {
  constructor(map, options) {
    const opts = options || {};

    this.interpolate =
      typeof opts.interpolate === 'undefined' ? true : opts.interpolate;

    this.map = map;
    this.trajectories = {};
    this.pointFeatures = [];
    this.rotationCache = {};
    this.renderFps = 1000 / 60;

    this.layer = new VectorLayer({
      zIndex: 1,
      source: new VectorSource(),
    });

    this.map.addLayer(this.layer);

    this.defaultStyle = new Style({
      image: new Circle({
        fill: new Fill({
          color: 'red',
        }),
      }),
    });

    this.updateTrajectories();

    /**
     * To enable smooth moving, slow down on move start
     * and speed up on move end.
     */
    this.map.on('movestart', () => {
      this.renderFps *= 100;
    });

    this.map.on('moveend', () => {
      this.renderFps /= 100;
    });
  }

  /**
   * Add a feature to the tracker.
   * @param {Number} id The feature id
   * @param {ol.Feature} feature The tracker feature.
   * @param {Boolean} addOnTop If true, the trajectory is added on top of
   *   the trajectory object. This affects the draw order. If addOnTop is
   *   true, the trajectory is drawn first and appears on bottom.
   */
  addTrajectory(id, traj, addOnTop) {
    if (addOnTop) {
      delete this.trajectories[id];
      const topTrajectory = {};
      topTrajectory[id] = traj;
      this.trajectories = Object.assign(topTrajectory, this.trajectories);
    } else {
      this.trajectories[id] = traj;
    }
  }

  /**
   * Remove a trajectory with a given id.
   * @param {Number} id The trajectory id
   */
  removeTrajectory(id) {
    delete this.trajectories[id];
  }

  /**
   * Remove a trajectory by attribute
   * @param {string} attributeName Name of the attribute.
   * @param {*} value Attribute value.
   */
  removeTrajectoryByAttribute(attributeName, value) {
    const trajKeys = Object.keys(this.trajectories);
    for (let i = trajKeys.length - 1; i >= 0; i -= 1) {
      const key = trajKeys[i];
      if (this.trajectories[key][attributeName] === value) {
        delete this.trajectories[key];

        /* eslint-disable */
        console.log(`Deleted trajectory with ${attributeName} = ${value}.`);
        /* eslint-enable */
      }
    }
  }

  /**
   * Return a list of features.
   * @return {Array.<ol.Feature>}
   */
  getPointFeatures() {
    return this.pointFeatures;
  }

  /**
   * Clear the tracker layer.
   */
  clear() {
    this.layer.getSource().clear();
    this.trajectories = {};
  }

  /**
   * Set the filter for tracker features.
   * @param {Function} filter Filter function.
   */
  setFilter(filter) {
    this.filter = filter;
  }

  /**
   * Set the tracker style.
   * @param {Function} s OpenLayers style function.
   */
  setStyle(s) {
    this.style = s;
    this.reload();
  }

  /**
   * Force map redraw.
   */
  changed() {
    this.map.changed();
  }

  /**
   * Update trajectories.
   */
  reload() {
    this.animationStartTime = new Date().getTime();
    this.layer.un('postcompose', e => this.render(e));
    this.layer.on('postcompose', e => this.render(e));
  }

  /**
   * Draw renderd point.
   */
  render(evt) {
    for (let i = 0, len = this.pointFeatures.length; i < len; i += 1) {
      const feature = this.pointFeatures[i];
      evt.vectorContext.drawFeature(
        feature,
        this.style ? this.style(feature) : this.defaultStyle,
      );
    }

    window.clearTimeout(this.renderTimeout);
    this.renderTimeout = window.setTimeout(() => {
      this.layer.changed();
    }, this.renderFps);
  }

  removeOutsideExtent(extent) {
    const trajKeys = Object.keys(this.trajectories);
    for (let i = 0; i < trajKeys.length; i += 1) {
      const key = trajKeys[i];
      const trajectory = this.trajectories[key];

      if (!containsCoordinate(extent, getCenter(trajectory.geometry))) {
        delete this.trajectories[key];
      }
    }
  }

  updateTrajectories() {
    const currTime = Date.now();
    const trajKeys = Object.keys(this.trajectories);
    const pointFeatures = [];

    for (let i = 0, len = trajKeys.length; i < len; i += 1) {
      const k = trajKeys[i];
      const props = this.trajectories[k];
      const intervals = props.time_intervals;
      let now = currTime - (props.timeOffset || 0);

      // the time interval will never start in the future
      if (intervals[0][0] > now) {
        [[now]] = intervals;
      }

      // find adjacent times in the interval list
      let j = 0;
      let start = 0;
      let end = 0;
      let startFrac = 0;
      let endFrac = 0;
      let rotation;

      for (j = 0; j < intervals.length - 1; j += 1) {
        [start, startFrac, rotation] = intervals[j];
        [end, endFrac] = intervals[j + 1];

        if (start <= now && now <= end) {
          break;
        } else {
          start = null;
          end = null;
        }
      }

      if (start && end) {
        // interpolate position based on the temporal fraction
        const timeFrac = Math.min((now - start) / (end - start), 1);
        const geomFrac = this.interpolate
          ? timeFrac * (endFrac - startFrac) + startFrac
          : 0;

        props.rotation = rotation === null ? props.rotation : rotation;
        props.geometry =
          props.geom instanceof Point
            ? props.geom
            : new Point(props.geom.getCoordinateAt(geomFrac));

        if (end === intervals[intervals.length - 1][0]) {
          props.end_fraction = timeFrac;
        }

        pointFeatures.push(new Feature(props));
      } else {
        delete this.trajectories[k];
      }
    }

    this.pointFeatures = pointFeatures;

    window.clearTimeout(this.updateTimeout);
    this.updateTimeout = window.setTimeout(() => {
      this.updateTrajectories();
    }, this.renderFps);
  }

  /**
   * Kill the tracker.
   */
  destroy() {
    this.clear();
    this.layer.un('postcompose', this.render, this);
    this.map.removeLayer(this.layer);
    window.clearTimeout(this.renderTimeout);
  }
}
