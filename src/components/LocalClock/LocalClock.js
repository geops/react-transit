import React from 'react';
import PropTypes from 'prop-types';

function LocalClock({ date, timeZone }) {
  let child = <i>?</i>;

  if (timeZone && timeZone !== 'UTC') {
    const localTime = new Date(date.getTime() + timeZone.os * 1000);
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
  date: PropTypes.instanceOf(Date).isRequired,
  timeZone: PropTypes.shape({
    os: PropTypes.number,
    c: PropTypes.string,
  }),
};

LocalClock.defaultProps = {
  timeZone: null,
};

export default LocalClock;
