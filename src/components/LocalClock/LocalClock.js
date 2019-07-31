import React from 'react';
import PropTypes from 'prop-types';

function LocalClock({ time, timeZone }) {
  let child = <i>?</i>;

  if (timeZone && timeZone !== 'UTC') {
    const localTime = new Date(time.getTime() + timeZone.os * 1000);
    child = (
      <span>
        {`${localTime.getUTCHours()}:${localTime.getUTCMinutes()}:${localTime.getUTCSeconds()} ('}${
          timeZone.c
        })`}
      </span>
    );
  }

  return <span>Local time: {child}</span>;
}

LocalClock.propTypes = {
  time: PropTypes.object.isRequired,
  timeZone: PropTypes.shape({
    os: PropTypes.number,
    c: PropTypes.string,
  }),
};

LocalClock.defaultProps = {
  timeZone: null,
};

export default LocalClock;
