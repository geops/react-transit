import React from 'react';
import PropTypes from 'prop-types';
import ReactTransitPropTypes from '../../propTypes';
import firstStation from '../../images/RouteSchedule/firstStation.png';
import station from '../../images/RouteSchedule/station.png';
import lastStation from '../../images/RouteSchedule/lastStation.png';
import { bgColors } from '../../config/tracker';
import { getHoursAndMinutes, getDelayString } from '../../utils/TimeUtils';

import TrackerLayer from '../../layers/TrackerLayer';

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
 * Returns true if the train doesn't stop to the station.
 * @param {Object} stop Station information.
 */
const isNotStop = stop => {
  return !stop.arrivalTime && !stop.departureTime;
};

/**
 * Returns if the station has already been passed by the vehicule.
 * @param {Object} stop Station information.
 */
const isPassed = (stop, time) => {
  // Sometimes stop.departureDelay is undefined.
  const timeToCompare = stop.departureTime || stop.arrivalTime || 0;
  const delayToCompare = stop.departureDelay || stop.arrivalDelay || 0;
  return !isNotStop(stop) && timeToCompare + delayToCompare <= time;
};

const getStationImg = (index, length) => {
  let src = station;
  if (index === 0) {
    src = firstStation;
  } else if (index === length - 1) {
    src = lastStation;
  }
  return src;
};

/**
 * Returns an image for first, middle or last stations.
 * @param {Number} index Index of the station in the list.
 * @param {Number} length Length of the stations list.
 */
const renderStationImg = (index, length) => {
  const src = getStationImg(index, length);
  return <img src={src} alt="routeScheduleLine" className="rt-route-icon" />;
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
  renderHeader: PropTypes.func,

  /**
   * Render Body of the route scheduler.
   */
  renderStations: PropTypes.func,

  /**
   * Function triggered on station's click event.
   */
  onStationClick: PropTypes.func,

  /**
   * Function to render header buttons.
   */
  renderHeaderButtons: PropTypes.func,
};

const defaultProps = {
  className: 'rt-route-wrapper',
  lineInfos: null,
  renderHeader: null,
  renderStations: null,
  onStationClick: () => {},
  renderHeaderButtons: null,
};

const renderRouteIdentifier = (id, longName) => {
  // first part of the id, without leading zeros.
  const routeIdentifier = parseInt(id.split('.')[0], 10);
  if (!longName.includes(routeIdentifier)) {
    return ` (${routeIdentifier})`;
  }
  return null;
};

const renderDefaultHeader = (lineInfos, renderHeaderButtons) => (
  <div className="rt-route-header">
    <span
      style={{
        backgroundColor:
          lineInfos.backgroundColor || bgColors[lineInfos.vehicleType],
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
    <div className="rt-route-buttons">
      {renderHeaderButtons && renderHeaderButtons(lineInfos.routeIdentifier)}
    </div>
  </div>
);

const renderDefaultStations = (lineInfos, onStationClick, trackerLayer) => (
  <div className="rt-route-body">
    {lineInfos.stations.map((stop, idx) => (
      <div
        key={stop.stationId}
        role="button"
        className={`rt-route-station${
          isPassed(stop, trackerLayer.currTime) ? ' rt-passed' : ''
        }${isNotStop(stop) ? ' rt-no-stop' : ''}`}
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
            {getHoursAndMinutes(stop.arrivalTime)}
          </span>
          <span className="rt-route-time-departure">
            {getHoursAndMinutes(stop.departureTime)}
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
  renderHeader,
  renderStations,
  onStationClick,
  trackerLayer,
  renderHeaderButtons,
}) {
  return lineInfos ? (
    <div className={className}>
      {(renderHeader || renderDefaultHeader)(lineInfos, renderHeaderButtons)}
      {(renderStations || renderDefaultStations)(
        lineInfos,
        onStationClick,
        trackerLayer,
      )}
    </div>
  ) : null;
}

RouteSchedule.propTypes = propTypes;
RouteSchedule.defaultProps = defaultProps;

export default RouteSchedule;
