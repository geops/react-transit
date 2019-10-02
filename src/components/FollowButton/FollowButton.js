import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-spatial/components/Button';
import CenterActive from '../../images/FollowButton/centerActive.svg';
import CenterInactive from '../../images/FollowButton/centerInactive.svg';

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
   * Trackerlayer.
   */
  trackerLayer: PropTypes.instanceOf(TrackerLayer).isRequired,

  /**
   * Function to set the map center, Used to follow a train.
   */
  setCenter: PropTypes.func.isRequired,
};

const defaultProps = {
  className: 'rt-control-button rt-route-follow',
  title: 'Follow',
};

/**
 * Button enables the follow of a selected train.
 */
class FollowButton extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      centerActived: false,
    };
  }

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
    const { centerActived } = this.state;
    const { trackerLayer } = this.props;

    const activated = !centerActived;

    if (activated && trackerLayer && trackerLayer.tracker) {
      this.centerOnTrajectory(routeIdentifier);
      this.updateInterval = window.setInterval(() => {
        this.centerOnTrajectory(routeIdentifier);
      }, 50);
    } else {
      clearInterval(this.updateInterval);
    }

    this.setState({
      centerActived: activated,
    });
  }

  changeRouteIdentifier() {
    clearInterval(this.updateInterval);
    this.setState({ centerActived: false });
  }

  render() {
    const { className, title, routeIdentifier } = this.props;
    const { centerActived } = this.state;

    return (
      <Button
        className={className}
        title={title}
        onClick={() => this.toggleFollow(routeIdentifier)}
      >
        {centerActived ? <CenterActive /> : <CenterInactive />}
      </Button>
    );
  }
}

FollowButton.propTypes = propTypes;
FollowButton.defaultProps = defaultProps;

export default FollowButton;
