import OLVectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { unByKey } from 'ol/Observable';
import Layer from 'react-spatial/layers/Layer';
import { buffer, containsCoordinate } from 'ol/extent';
import Tracker from './Tracker';
import { timeSteps } from '../config/tracker';

/**
 * Responsible for loading tracker data.
 * Extented from Layer {@link https://react-spatial.geops.de/docjs.html react-spatial/layers/Layer}
 * @class
 * @inheritDoc
 * @param {Object} options
 * @param {boolean} options.useDelayStyle Set the delay style.
 * @param {string} options.delayOutlineColor Set the delay outline color.
 * @param {string} options.onClick Callback function on feature click.
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

    this.selectedVehicleId = null;

    this.currTime = new Date();

    this.lastUpdateTime = new Date();

    this.lastRequestTime = 0;

    this.speed = 1;

    this.clickCallbacks = [];

    this.delayOutlineColor = options.delayOutlineColor || '#000000';

    this.useDelayStyle = options.useDelayStyle || false;

    // Add click callback
    if (options.onClick) {
      this.onClick(options.onClick);
    }
  }

  /**
   * Initialize the layer and listen to feature clicks.
   * @param {ol.map} map ol.map (https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html)
   * @private
   */
  init(map) {
    super.init(map);
    if (!this.map) {
      return;
    }

    this.tracker = new Tracker(this.map);
    this.tracker.setStyle((props, r) => this.style(props, r));

    if (this.getVisible()) {
      this.start();
    }

    this.visibilityRef = this.on('change:visible', v => {
      if (v.target.getVisible()) {
        this.start();
      }
    });
  }

  terminate() {
    super.terminate();
    this.stop();
    unByKey(this.visibilityRef);
    if (this.tracker) {
      this.tracker.destroy();
      this.tracker = null;
    }
  }

  /**
   * Trackerlayer is started
   * @param {ol.map} map {@link https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html ol/Map}
   * @private
   */
  start() {
    this.stop();
    this.tracker.setVisible(true);
    this.onMoveStartRef = this.map.on('movestart', () => this.onMoveStart());
    this.onMoveEndRef = this.map.on('moveend', () => this.onMoveEnd());
    this.onPointerMoveRef = this.map.on('pointermove', e =>
      this.onPointerMove(e),
    );
    this.onPostRenderRef = this.map.on('postrender', () => {
      if (this.isMapMoving) {
        this.tracker.renderTrajectory(this.currTime);
      }
    });
    this.tracker.renderTrajectory(this.currTime);
    this.startUpdateTrajectories();
    this.startUpdateTime();
  }

  /**
   * Stop current layer,.
   * @private
   */
  stop() {
    if (this.tracker) {
      this.tracker.clear();
      this.tracker.setVisible(false);
    }
    unByKey([
      this.onMoveStartRef,
      this.onMoveEndRef,
      this.onPointerMoveRef,
      this.onPostRenderRef,
    ]);
    this.stopUpdateTrajectories();
    this.stopUpdateTime();
    this.abortFetchTrajectories();
  }

  /**
   * Set visibility.
   * @param {boolean} visible
   * @param {boolean} stopPropagationDown Stops propagation down.
   * @param {boolean} stopPropagationUp Stops propagation up.
   * @param {boolean} stopPropagationSiblings Stops propagation toward siblings.
   */
  setVisible(
    visible,
    stopPropagationDown = false,
    stopPropagationUp = false,
    stopPropagationSiblings = false,
  ) {
    super.setVisible(
      visible,
      stopPropagationDown,
      stopPropagationUp,
      stopPropagationSiblings,
    );

    if (this.getVisible()) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Start the update of trajectories.
   * @private
   */
  startUpdateTrajectories() {
    this.stopUpdateTrajectories();

    this.updateTrajectories();
    this.updateInterval = window.setInterval(() => {
      this.updateTrajectories();
    }, this.requestIntervalSeconds * 1000);
  }

  /**
   * Stop the update of trajectories.
   * @private
   */
  stopUpdateTrajectories() {
    clearInterval(this.updateInterval);
  }

  /**
   * Start to update the current time depending on the speed.
   * @private
   */
  startUpdateTime() {
    this.stopUpdateTime();
    this.updateTime = setInterval(() => {
      const newTime =
        this.currTime.getTime() +
        (new Date() - this.lastUpdateTime) * this.speed;
      this.setCurrTime(newTime);
    }, this.getRefreshTimeInMs());
  }

  /**
   * Stop to update time.
   * @private
   */
  stopUpdateTime() {
    clearInterval(this.updateTime);
  }

  /**
   * Get the current time.
   * @returns {Date}
   */
  getCurrTime() {
    return this.currTime;
  }

  /**
   * Set the current time, it triggers a rendering of the trajectories.
   * @param {dateString | value} time
   */
  setCurrTime(time) {
    const newTime = new Date(time);
    this.currTime = newTime;
    this.lastUpdateTime = new Date();
    if (!this.isMapMoving) {
      this.tracker.renderTrajectory(this.currTime);
    }
  }

  /**
   * Get the Speed.
   * @returns {number}
   */
  getSpeed() {
    return this.speed;
  }

  /**
   * Set the speed.
   * @param {number} speed
   */
  setSpeed(speed) {
    this.speed = speed;
    this.start();
  }

  /**
   * Fetch trajectories at given URL.
   * @param {string} url
   * @private
   */
  fetchTrajectories(url) {
    this.abortFetchTrajectories();
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    return fetch(url, { signal })
      .then(data => data.json())
      .catch(err => {
        // eslint-disable-next-line no-console
        console.warn('Fetch trajectories request failed: ', err);
      });
  }

  abortFetchTrajectories() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Returns the vehicle which are at the given coordinates.
   * Returns null when no vehicle is located at the given coordinates.
   * @param {ol.coordinate} coordinate
   * @returns {ol.feature | null}
   * @private
   */
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

  getRefreshTimeInMs() {
    const z = this.map.getView().getZoom();
    const roundedZoom = Math.round(z);
    const timeStep = timeSteps[roundedZoom] || 25;
    const nextTick = Math.max(25, timeStep / this.speed);
    return nextTick;
  }

  onMoveStart() {
    this.isMapMoving = true;
  }

  onMoveEnd() {
    this.isMapMoving = false;
    const z = this.map.getView().getZoom();

    if (z !== this.currentZoom) {
      this.currentZoom = z;
      this.startUpdateTime();
    }
    this.updateTrajectories();
  }

  onPointerMove(e) {
    if (e.dragging) {
      return;
    }
    const vehicle = this.getVehicleAtCoordinate(e.coordinate);
    this.map.getTarget().style.cursor = vehicle ? 'pointer' : 'auto';
    this.hoverVehicleId = vehicle && vehicle.id;
    this.tracker.setHoverVehicleId(this.hoverVehicleId);
  }

  /**
   * Define the style of the vehicle.
   * Draw a blue circle with the id of the props parameter.
   *
   * @param {Object} props Properties
   * @private
   */
  style(props) {
    const { id: text } = props;
    if (this.styleCache[text]) {
      return this.styleCache[text];
    }
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 15;
    const ctx = canvas.getContext('2d');
    ctx.arc(8, 8, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#8ED6FF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.font = 'bold 12px arial';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeText(text, 20, 10);
    ctx.fillStyle = 'black';
    ctx.fillText(text, 20, 10);
    this.styleCache[text] = canvas;
    return this.styleCache[text];
  }

  /**
   * Listens to click events on the layer.
   * @param {function} callback Callback function, called with the clicked
   *   features (https://openlayers.org/en/latest/apidoc/module-ol_Feature.html),
   *   the layer instance and the click event.
   */
  onClick(callback) {
    if (typeof callback === 'function') {
      this.clickCallbacks.push(callback);
    } else {
      throw new Error('callback must be of type function.');
    }
  }
}

export default TrackerLayer;
