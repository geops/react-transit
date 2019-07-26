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
    this.trajectories = [];
    this.pointFeatures = [];
    this.rotationCache = {};
    this.renderFps = 16;
    this.layer = options.layer;

    if (!this.layer) {
      this.layer = new VectorLayer({
        zIndex: 1,
        source: new VectorSource(),
      });

      this.map.addLayer(this.layer);
    }

    this.defaultStyle = new Style({
      image: new Circle({
        fill: new Fill({
          color: 'red',
        }),
      }),
    });

    this.updateTrajectories();

    this.map.on('movestart', () => {
      this.renderFps = 1;
    });

    this.map.on('moveend', () => {
      const view = this.map.getView();
      this.renderFps = Math.max(view.getZoom());
      this.resolution = view.getResolution();
    });
  }

  setTrajectories(trajectories) {
    this.trajectories = trajectories;
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
    const trajectory = { ...traj, id };

    if (addOnTop) {
      this.trajectories.unshift(trajectory);
    } else {
      this.trajectories.push(trajectory);
    }
  }

  /**
   * Remove a trajectory with a given id.
   * @param {Number} id The trajectory id
   */
  removeTrajectory(id) {
    for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
      if (this.trajectories[i].id === id) {
        this.trajectories.splice(i, 1);
        break;
      }
    }
  }

  /**
   * Remove a trajectory by attribute
   * @param {string} attributeName Name of the attribute.
   * @param {*} value Attribute value.
   */
  removeTrajectoryByAttribute(attributeName, value) {
    for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
      if (this.trajectories[i][attributeName] === value) {
        this.removeTrajectory(this.trajectories[i].id);

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
    this.trajectories = [];
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
        this.style ? this.style(feature, this.resolution) : this.defaultStyle,
      );
    }

    window.clearTimeout(this.renderTimeout);
    this.renderTimeout = window.setTimeout(() => {
      this.layer.changed();
    }, 60 / this.renderFps);
  }

  removeOutsideExtent(extent) {
    for (let i = 0, len = this.trajectories.length; i < len; i += 1) {
      const center = getCenter(this.trajectories[i].geometry);
      if (!containsCoordinate(extent, center)) {
        this.removeTrajectory(this.trajectories[i].id);
      }
    }
  }

  updateTrajectories() {
    const currTime = Date.now();
    const pointFeatures = [];

    for (let i = this.trajectories.length - 1; i >= 0; i -= 1) {
      const traj = this.trajectories[i];
      const intervals = traj.time_intervals;
      let now = currTime - (traj.timeOffset || 0);

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

        traj.rotation = rotation === null ? traj.rotation : rotation;
        traj.geometry =
          traj.geom instanceof Point
            ? traj.geom
            : new Point(traj.geom.getCoordinateAt(geomFrac));

        if (end === intervals[intervals.length - 1][0]) {
          traj.end_fraction = timeFrac;
        }

        pointFeatures.push(new Feature(traj));
      } else {
        this.removeTrajectory(traj.id);
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
