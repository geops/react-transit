import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaForward, FaBackward } from 'react-icons/fa';

const increaseSpeed = speed => {
  let delta = 0.1;
  if (speed >= 1) {
    delta = 1;
  }
  if (speed >= 10) {
    delta = 5;
  }
  const nextSpeed = speed + delta;
  return nextSpeed > 30 ? speed : nextSpeed;
};

const decreaseSpeed = speed => {
  let delta = 0.1;
  if (speed > 1) {
    delta = 1;
  }
  if (speed > 10) {
    delta = 5;
  }
  const nextSpeed = speed - delta;
  if (nextSpeed < 0.1) {
    return speed;
  }
  return nextSpeed;
};

const defaultRenderButton = (icon, onClick) => {
  return (
    <button type="button" onClick={onClick}>
      {icon}
    </button>
  );
};

function TrackerControl({
  iconSpeedDown,
  iconSpeedReset,
  iconSpeedUp,
  renderButton,
  onChange,
}) {
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    onChange(speed);
  }, [speed, onChange]);

  return (
    <>
      {renderButton(iconSpeedDown, () => setSpeed(decreaseSpeed(speed)))}
      {renderButton(iconSpeedReset, () => setSpeed(1))}
      {renderButton(iconSpeedUp, () => setSpeed(increaseSpeed(speed)))}
      <span>{`${speed < 1 ? speed.toFixed(1) : speed}x`}</span>
    </>
  );
}

TrackerControl.propTypes = {
  iconSpeedDown: PropTypes.element,
  iconSpeedUp: PropTypes.element,
  iconSpeedReset: PropTypes.element,
  renderButton: PropTypes.func,
  onChange: PropTypes.func,
};

TrackerControl.defaultProps = {
  iconSpeedDown: <FaBackward />,
  iconSpeedReset: <FaPlay />,
  iconSpeedUp: <FaForward />,
  renderButton: defaultRenderButton,
  onChange: () => {},
};

export default TrackerControl;
