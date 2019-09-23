import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-spatial/components/Button';
import filterActive from '../../images/FilterButton/filterActive.png';
import filterInactive from '../../images/FilterButton/filterInactive.png';

import TrackerLayer from '../../layers/TrackerLayer';
import TrajservLayer from '../../layers/TrajservLayer';

const propTypes = {
  /**
   * CSS class of the filter button.
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
};

const defaultProps = {
  className: 'rt-control-button rt-route-filter',
  title: 'Filter',
};

/**
 * Displaying all stops of a line, and their informations.
 */
class FilterButton extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      filterActivated: false,
    };
  }

  toggleFilter(routeIdentifier) {
    const { filterActivated } = this.state;
    const { trackerLayer } = this.props;

    const activated = !filterActivated;

    const filterFc = TrajservLayer.createFilter(
      undefined,
      routeIdentifier.split('.')[0],
    );
    if (activated) {
      trackerLayer.tracker.setFilter(filterFc);
    } else {
      trackerLayer.tracker.setFilter(null);
    }

    this.setState({
      filterActivated: activated,
    });
  }

  render() {
    const { className, title, routeIdentifier } = this.props;
    const { filterActivated } = this.state;

    return (
      <Button
        className={className}
        title={title}
        onClick={() => this.toggleFilter(routeIdentifier)}
      >
        <img
          src={filterActivated ? filterActive : filterInactive}
          alt={filterActivated ? filterActive : filterInactive}
        />
      </Button>
    );
  }
}

FilterButton.propTypes = propTypes;
FilterButton.defaultProps = defaultProps;

export default FilterButton;
