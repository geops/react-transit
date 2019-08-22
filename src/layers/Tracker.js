import { LineString } from 'ol/geom';

/**
 * Tracker for OpenLayers.
 * @class
 * @param {ol.map} map (https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html)
 * @param {Object} options
 */
export default class Tracker {
  constructor(map, options) {
    const opts = {
      interpolate: true,
      ...options,
    };

    this.interpolate = !!opts.interpolate;

    this.map = map;
    this.trajectories = [];
    this.rotationCache = {};
    this.renderFps = 60;

    this.map.once('rendercomplete', () => {
      [this.canvas.width, this.canvas.height] = this.map.getSize();
    });

    this.map.on('change:size', () => {
      [this.canvas.width, this.canvas.height] = this.map.getSize();
    });

    // we draw directly on the canvas since openlayers is too slow
    this.canvas = opts.canvas || document.createElement('canvas');
    this.canvas.style = [
      'position: absolute',
      'top: 0',
      'bottom: 0',
      'right: 0',
      'left: 0',
      'pointer-events: none',
      'visibility: visible',
    ].join(';');

    this.canvasContext = this.canvas.getContext('2d');

    this.map.once('postrender', () => {
      this.map.getTarget().appendChild(this.canvas);
    });
  }

  /**
   * Define the trajectories
   * @param {array<ol.feature>} trajectories
   */
  setTrajectories(trajectories) {
    if (this.sort) {
      trajectories.sort(this.sort);
    }

    this.trajectories = trajectories;
  }

  /**
   * Return the trajectories
   * @returns {array<trajectory>} trajectories
   */
  getTrajectories() {
    return this.trajectories;
  }

  /**
   * Add a feature to the tracker.
   * @param {Number} id The feature id
   * @param {ol.Feature} traj The tracker feature.
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
   * Clear the canvas.
   */
  clear() {
    if (this.canvas) {
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Set the filter for tracker features.
   * @param {Function} filter Filter function.
   */
  setFilter(filter) {
    this.filter = filter;
  }

  /**
   * Set the sort for tracker features.
   * @param {Function} sort Sort function.
   */
  setSort(sort) {
    this.sort = sort;
  }

  /**
   * Set the id of the trajectory whixh is hovered .
   * @param {string} id Id of a vehicle.
   */
  setHoverVehicleId(id) {
    this.hoverVehicleId = id;
  }

  /**
   * Set the tracker style.
   * @param {Function} s OpenLayers style function.
   */
  setStyle(s) {
    this.style = s;
  }

  /**
   *
   * @param {Date} currTime
   */
  renderTrajectory(currTime = Date.now()) {
    this.clear();
    const res = this.map.getView().getResolution();
    let hoverVehicleImg;
    let hoverVehiclePx;

    for (let i = this.trajectories.length - 1; i >= 0; i -= 1) {
      const traj = this.trajectories[i];

      // We simplify the traj object
      const { geometry, timeIntervals, timeOffset } = traj;

      if (this.filter && !this.filter(traj)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const coords = geometry.getCoordinates();
      let coord = null;
      const nbCoords = coords.length;

      if (timeIntervals && timeIntervals.length > 1) {
        const now = currTime - (timeOffset || 0);
        let start;
        let end;
        let numCoordStart;
        let numCoordEnd;

        // Search th time interval.
        for (let j = 0; j < timeIntervals.length - 1; j += 1) {
          [start, numCoordStart] = timeIntervals[j];
          [end, numCoordEnd] = timeIntervals[j + 1];

          if (start <= now && now <= end) {
            break;
          } else {
            start = null;
            end = null;
          }
        }

        if (start && end) {
          // interpolate position inside the time interval.
          const geomFrac = this.interpolate
            ? Math.min((now - start) / (end - start), 1)
            : 0;
          let intervalGeom = geometry;
          if (nbCoords > 2) {
            intervalGeom = new LineString(
              coords.slice(numCoordStart, numCoordEnd + 1),
            );
          }
          coord = intervalGeom.getCoordinateAt(geomFrac);
        }
      }

      if (coord) {
        this.trajectories[i].coordinate = coord;
        const px = this.map.getPixelFromCoordinate(coord);

        if (!px) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const vehicleImg = this.style(traj, res);
        if (this.hoverVehicleId !== traj.id) {
          this.canvasContext.drawImage(
            vehicleImg,
            px[0] - vehicleImg.height / 2,
            px[1] - vehicleImg.height / 2,
          );
        } else {
          // Store the canvas to draw it at the end
          hoverVehicleImg = vehicleImg;
          hoverVehiclePx = px;
        }
      }
    }
    if (hoverVehicleImg) {
      this.canvasContext.drawImage(
        hoverVehicleImg,
        hoverVehiclePx[0] - hoverVehicleImg.height / 2,
        hoverVehiclePx[1] - hoverVehicleImg.height / 2,
      );
    }
  }

  /**
   * Kill the tracker.
   */
  destroy() {
    this.clear();
    this.map.removeLayer(this.layer);
    window.clearTimeout(this.renderTimeout);
  }
}
