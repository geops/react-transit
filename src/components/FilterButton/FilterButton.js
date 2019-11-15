import React, { PureComponent } from 'react';
import qs from 'query-string';
import PropTypes from 'prop-types';
import Button from 'react-spatial/components/Button';
import Filter from '../../images/FilterButton/filter.svg';
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
   * Children content of the button.
   */
  children: PropTypes.element,
};

const defaultProps = {
  className: 'rt-control-button rt-route-filter',
  children: <Filter focusable={false} />,
  title: 'Filter',
};

/**
 * Button enables the filtering of a selected train.
 */
class FilterButton extends PureComponent {
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
    const { trackerLayer, active, onChange } = this.props;

    const activated = !active;

    let filterFc = TrajservLayer.createFilter(
      undefined,
      routeIdentifier.split('.')[0],
    );
    if (trackerLayer && trackerLayer.tracker) {
      if (activated) {
        this.updatePermalink(false);
        trackerLayer.setFilter(filterFc);
      } else {
        this.updatePermalink(true);
        const parameters = qs.parse(window.location.search.toLowerCase());
        const lineParam = parameters[TrajservLayer.LINE_FILTER];
        const routeParam = parameters[TrajservLayer.ROUTE_FILTER];
        const opParam = parameters[TrajservLayer.OPERATOR_FILTER];

        filterFc = null;
        if (lineParam || routeParam || opParam) {
          filterFc = TrajservLayer.createFilter(
            lineParam ? lineParam.split(',') : undefined,
            routeParam ? routeParam.split(',') : undefined,
            opParam ? opParam.split(',') : undefined,
          );
        }

        trackerLayer.setFilter(filterFc);
      }
    }

    onChange(activated);
  }

  render() {
    const { className, title, routeIdentifier, active, children } = this.props;

    return (
      <Button
        className={`${className}${active ? ' rt-active' : ' rt-inactive'}`}
        title={title}
        onClick={() => this.toggleFilter(routeIdentifier)}
      >
        {children}
      </Button>
    );
  }
}

FilterButton.propTypes = propTypes;
FilterButton.defaultProps = defaultProps;

export default FilterButton;
