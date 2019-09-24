import React, { PureComponent } from 'react';
import qs from 'query-string';
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
 * Button enables the filtering of a selected train.
 */
class FilterButton extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      filterActivated: false,
    };
  }

  updatePermalink(isRemoving) {
    const { routeIdentifier } = this.props;

    const parameters = qs.parse(window.location.search.toLowerCase());
    if (isRemoving) {
      delete parameters.tripnumber;
    } else {
      parameters.tripnumber = parseInt(routeIdentifier.split('.')[0], 10);
    }

    const qStr = qs.stringify(parameters, { encode: false });
    const search = `?${qStr}`;
    const { hash } = window.location;
    window.history.replaceState(undefined, undefined, `${search}${hash || ''}`);
  }

  toggleFilter(routeIdentifier) {
    const { filterActivated } = this.state;
    const { trackerLayer } = this.props;

    const activated = !filterActivated;

    const filterFc = TrajservLayer.createFilter(
      undefined,
      routeIdentifier.split('.')[0],
    );
    if (trackerLayer && trackerLayer.tracker) {
      if (activated) {
        this.updatePermalink(false);
        trackerLayer.tracker.setFilter(filterFc);
      } else {
        this.updatePermalink(true);
        trackerLayer.tracker.setFilter(null);
      }
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
