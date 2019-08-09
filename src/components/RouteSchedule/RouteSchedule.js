import React from 'react';
import PropTypes from 'prop-types';
import firstStation from '../../images/RouteSchedule/firstStation.png';
import station from '../../images/RouteSchedule/station.png';
import lastStation from '../../images/RouteSchedule/lastStation.png';

import './RouteSchedule.scss';

const pad = number => {
  return `${number < 10 ? '0' : ''}${number}`;
};

const getTimeString = t => {
  if (t === -1) {
    return '';
  }
  const h = Math.floor(t / 36000000);
  const m = Math.floor((t % 36000000) / 600000);
  return `${pad(h)}:${pad(m)}`;
};

const getDelayString = t => {
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor(((t % 3600000) % 60000) / 1000);

  if (s === 0 && h === 0 && m === 0) {
    return '0';
  }
  if (s === 0 && h === 0) {
    return `${pad(m)}m`;
  }
  if (s === 0) {
    return `${pad(h)}h${pad(m)}m`;
  }
  if (m === 0 && h === 0) {
    return `${pad(s)}s`;
  }
  if (h === 0) {
    return `${pad(m)}m${pad(s)}s`;
  }
  return `${pad(h)}h${pad(m)}m${pad(s)}s`;
};

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
  lineInfos: PropTypes.object,

  /**
   * HTML tabIndex attribute
   */
  stationTabIndex: PropTypes.number,

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
};

const defaultProps = {
  className: 'rt-route-wrapper',
  lineInfos: null,
  stationTabIndex: 0,
  renderHeader: lineInfos => {
    return (
      <div className="rt-route-header">
        <span
          style={{
            backgroundColor: `#${lineInfos.c}`,
            color: `#${lineInfos.tc}`,
          }}
          className="rt-route-icon"
        >
          {lineInfos.sn}
        </span>
        <div className="rt-route-title">
          <span className="rt-route-name">{lineInfos.hs}</span>
          <span>{lineInfos.ln}</span>
        </div>
      </div>
    );
  },
  renderStations: (lineInfos, stationTabIndex, onStationClick) => (
    <div className="rt-route-body">
      {lineInfos.sts.map((stop, idx) => (
        <div
          key={stop.sid}
          role="button"
          className="rt-route-station"
          onClick={e => onStationClick(stop, e)}
          tabIndex={stationTabIndex}
          onKeyPress={e => e.which === 13 && onStationClick(stop, e)}
        >
          <div className="rt-route-delay">
            {stop.ad ? (
              <span
                className={`rt-route-delay-arrival${` ${getDelayColor(
                  stop.ad,
                )}`}`}
              >
                {`+${getDelayString(stop.ad)}`}
              </span>
            ) : null}
            {stop.dd ? (
              <span
                className={`rt-route-delay-arrival${` ${getDelayColor(
                  stop.dd,
                )}`}`}
              >
                {`+${getDelayString(stop.dd)}`}
              </span>
            ) : null}
          </div>
          <div className="rt-route-times">
            <span className="rt-route-time-arrival">
              {getTimeString(stop.at)}
            </span>
            <span className="rt-route-time-departure">
              {getTimeString(stop.dt)}
            </span>
          </div>
          {renderStationImg(idx, lineInfos.sts.length)}
          <div>{stop.n}</div>
        </div>
      ))}
    </div>
  ),
  onStationClick: () => {},
};

/**
 * RouteSchedule.
 * Displaying all stops of a line, and their informations.
 */

function RouteSchedule({
  className,
  lineInfos,
  renderHeader,
  renderStations,
  stationTabIndex,
  onStationClick,
}) {
  return lineInfos ? (
    <div className={className}>
      {renderHeader(lineInfos)}
      {renderStations(lineInfos, stationTabIndex, onStationClick)}
    </div>
  ) : null;
}

RouteSchedule.propTypes = propTypes;
RouteSchedule.defaultProps = defaultProps;

export default RouteSchedule;
