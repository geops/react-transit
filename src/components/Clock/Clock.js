import React from 'react';
import PropTypes from 'prop-types';

function Clock({ time }) {
  return <>{`${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`}</>;
}

Clock.propTypes = {
  time: PropTypes.object.isRequired,
};

export default Clock;
