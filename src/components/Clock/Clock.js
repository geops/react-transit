import React from 'react';
import PropTypes from 'prop-types';

const pad = integer => {
  return integer < 10 ? `0${integer}` : integer;
};

function Clock({ date }) {
  return (
    <>{`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds(),
    )}`}</>
  );
}

Clock.propTypes = {
  date: PropTypes.object.isRequired,
};

export default Clock;
