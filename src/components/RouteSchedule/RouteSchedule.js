import React from 'react';
import PropTypes from 'prop-types';
import ReactTransitPropTypes from '../../propTypes';
import firstStation from '../../images/RouteSchedule/firstStation.png';
import station from '../../images/RouteSchedule/station.png';
import lastStation from '../../images/RouteSchedule/lastStation.png';
import { bgColors } from '../../config/tracker';

import TrackerLayer from '../../layers/TrackerLayer';

/**
 * Returns a paded number (with leading 0 for integer < 10).
 * @param {Number} number number.
 */
const pad = number => {
  return `${number < 10 ? '0' : ''}${number}`;
};

/**
 * Returns a 'hh:mm' string from a time.
 * @param {Number} t time in milliseconds.
 */
const getTimeString = t => {
  if (t === -1) {
    return '';
  }
  const h = Math.floor(t / 36000000);
  const m = Math.floor((t % 36000000) / 600000);
  return `${pad(h)}:${pad(m)}`;
};

/**
 * Returns a color class to display the delay.
 * @param {Number} time Delay time in milliseconds.
 */
const getDelayString = t => {
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor(((t % 3600000) % 60000) / 1000);

  if (s === 0 && h === 0 && m === 0) {
    return '0';
  }
  if (s === 0 && h === 0) {
    return `${m}m`;
  }
  if (s === 0) {
    return `${h}h${m}m`;
  }
  if (m === 0 && h === 0) {
    return `${s}s`;
  }
  if (h === 0) {
    return `${m}m${s}s`;
  }
  return `${h}h${m}m${s}s`;
};

/**
 * Returns a color class to display the delay.
 * @param {Number} time Delay time in milliseconds.
 */
const getDelayColor = time => {
  const secs = Math.round(((time / 1800 / 2) * 3600) / 1000);
  if (secs >= 3600) {
    return 'dark-red';
  }
  if (secs >= 500) {
    return 'middle-red';
  }
  if (secs >= 300) {
    return 'light-red';
  }
  if (secs >= 180) {
    return 'orange';
  }
  return 'green';
};

/**
 * Returns if the station has already been passed by the vehicule.
 * @param {Object} stop Station information.
 */
const isPassed = (stop, time) => {
  return stop.departureDate * 1000 + stop.departureDelay <= time;
};

/**
 * Returns an image for first, middle or last stations.
 * @param {Number} index index of the station in the list.
 * @param {Number} length Length of the stations list.
 */
const renderStationImg = (index, length) => {
  if (index === 0) {
    return (
      <img
        src={firstStation}
        alt="routeScheduleLine"
        className="rt-route-icon"
      />
    );
  }
  if (index === length - 1) {
    return (
      <img
        src={lastStation}
        alt="routeScheduleLine"
        className="rt-route-icon"
      />
    );
  }
  return (
    <img src={station} alt="routeScheduleLine" className="rt-route-icon" />
  );
};

const propTypes = {
  /**
   * CSS class of the route schedule wrapper.
   */
  className: PropTypes.string,

  /**
   * Trajectory stations informations.
   */
  lineInfos: ReactTransitPropTypes.lineInfos,

  /**
   * Trackerlayer.
   */
  trackerLayer: PropTypes.instanceOf(TrackerLayer).isRequired,

  /**
   * Render Header of the route scheduler.
   */
  header: PropTypes.func,

  /**
   * Render Body of the route scheduler.
   */
  stations: PropTypes.func,

  /**
   * Function triggered on station's click event.
   */
  onStationClick: PropTypes.func,
};

const defaultProps = {
  className: 'rt-route-wrapper',
  lineInfos: null,
  header: null,
  stations: null,
  onStationClick: () => {},
};

const renderRouteIdentifier = (id, longName) => {
  // first part of the id, without leading zeros.
  const routeIdentifier = parseInt(id.split('.')[0], 10);
  if (!longName.includes(routeIdentifier)) {
    return ` (${routeIdentifier})`;
  }
  return null;
};

const renderHeader = lineInfos => (
  <div className="rt-route-header">
    <span
      style={{
        backgroundColor:
          lineInfos.backgroundColor || bgColors[lineInfos.vehiculeType],
        color: lineInfos.color || 'black',
      }}
      className="rt-route-icon"
    >
      {lineInfos.shortName}
    </span>
    <div className="rt-route-title">
      <span className="rt-route-name">{lineInfos.destination}</span>
      <span>
        {lineInfos.longName}
        {renderRouteIdentifier(lineInfos.routeIdentifier, lineInfos.longName)}
      </span>
    </div>
  </div>
);

const renderStations = (lineInfos, onStationClick, trackerLayer) => (
  <div className="rt-route-body">
    {lineInfos.stations.map((stop, idx) => (
      <div
        key={stop.stationId}
        role="button"
        className={`rt-route-station${
          isPassed(stop, trackerLayer.getCurrTime()) ? ' rt-passed' : ''
        }`}
        onClick={e => onStationClick(stop, e)}
        tabIndex={0}
        onKeyPress={e => e.which === 13 && onStationClick(stop, e)}
      >
        <div className="rt-route-delay">
          {typeof stop.arrivalDelay === 'undefined' || idx === 0 ? null : (
            <span
              className={`rt-route-delay-arrival${` ${getDelayColor(
                stop.arrivalDelay,
              )}`}`}
            >
              {`+${getDelayString(stop.arrivalDelay)}`}
            </span>
          )}
          {typeof stop.departureDelay === 'undefined' ||
          idx === lineInfos.stations.length - 1 ? null : (
            <span
              className={`rt-route-delay-arrival${` ${getDelayColor(
                stop.departureDelay,
              )}`}`}
            >
              {`+${getDelayString(stop.departureDelay)}`}
            </span>
          )}
        </div>
        <div className="rt-route-times">
          <span className="rt-route-time-arrival">
            {getTimeString(stop.arrivalTime)}
          </span>
          <span className="rt-route-time-departure">
            {getTimeString(stop.departureTime)}
          </span>
        </div>
        {renderStationImg(idx, lineInfos.stations.length)}
        <div
          className={
            idx === lineInfos.stations.length - 1 && stop.cancelled
              ? 'rt-route-cancelled'
              : null
          }
        >
          {stop.stationName}
        </div>
      </div>
    ))}
  </div>
);

/**
 * RouteSchedule displays information, stops and punctuality about the clicked route.
 */
function RouteSchedule({
  className,
  lineInfos,
  header,
  stations,
  onStationClick,
  trackerLayer,
}) {
  return lineInfos ? (
    <div className={className}>
      {header || renderHeader(lineInfos)}
      {stations || renderStations(lineInfos, onStationClick, trackerLayer)}
    </div>
  ) : null;
}

RouteSchedule.propTypes = propTypes;
RouteSchedule.defaultProps = defaultProps;

export default RouteSchedule;
