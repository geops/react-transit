import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-spatial/components/Button';
import Follow from '../../images/FollowButton/follow.svg';

import TrackerLayer from '../../layers/TrackerLayer';

const propTypes = {
  /**
   * CSS class of the follow button.
   */
  className: PropTypes.string,

  /**
   * Title.
   */
  title: PropTypes.string,

  /**
   * Line info route identifer.
   */
  routeIdentifier: PropTypes.string.isRequired,

  /**
   * Button is active.
   */
  active: PropTypes.bool.isRequired,

  /**
   * Function triggered on button change.
   */
  onChange: PropTypes.func.isRequired,

  /**
   * Trackerlayer.
   */
  trackerLayer: PropTypes.instanceOf(TrackerLayer).isRequired,

  /**
   * Function to set the map center, Used to follow a train.
   */
  setCenter: PropTypes.func.isRequired,

  /**
   * Children content of the button.
   */
  children: PropTypes.element,
};

const defaultProps = {
  className: 'rt-control-button rt-route-follow',
  children: <Follow focusable={false} />,
  title: 'Follow',
};

/**
 * Button enables the follow of a selected train.
 */
class FollowButton extends PureComponent {
  componentDidUpdate(prevProps) {
    const { routeIdentifier } = this.props;
    if (routeIdentifier !== prevProps.routeIdentifier) {
      this.changeRouteIdentifier();
    }
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval);
  }

  centerOnTrajectory(routeIdentifier) {
    const { trackerLayer, setCenter } = this.props;

    const [trajectory] = trackerLayer.getVehicle(
      r => r.routeIdentifier === routeIdentifier,
    );
    const firstCoord = trajectory && trajectory.coordinate;
    if (firstCoord) {
      setCenter(firstCoord);
    }
  }

  toggleFollow(routeIdentifier) {
    const { trackerLayer, active, onChange } = this.props;

    const activated = !active;

    if (activated && trackerLayer && trackerLayer.tracker) {
      this.centerOnTrajectory(routeIdentifier);
      this.updateInterval = window.setInterval(() => {
        this.centerOnTrajectory(routeIdentifier);
      }, 50);
    } else {
      clearInterval(this.updateInterval);
    }

    onChange(activated);
  }

  changeRouteIdentifier() {
    const { onChange } = this.props;
    clearInterval(this.updateInterval);
    onChange(false);
  }

  render() {
    const { className, title, routeIdentifier, active, children } = this.props;

    return (
      <Button
        className={`${className}${active ? ' rt-active' : ' rt-inactive'}`}
        title={title}
        onClick={() => this.toggleFollow(routeIdentifier)}
      >
        {children}
      </Button>
    );
  }
}

FollowButton.propTypes = propTypes;
FollowButton.defaultProps = defaultProps;

export default FollowButton;
