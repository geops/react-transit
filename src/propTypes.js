import PropTypes from 'prop-types';

const station = PropTypes.shape({
  arrivalDelay: PropTypes.number, // time in milliseconds.
  arrivalTime: PropTypes.number, // time in milliseconds.
  arrivalTimeWithDelay: PropTypes.number, // time in milliseconds with the delay included.
  cancelled: PropTypes.boolean,
  coordinates: PropTypes.arrayOf(PropTypes.number),
  departureDelay: PropTypes.number, // time in milliseconds.
  departureTime: PropTypes.number, // time in milliseconds.
  departureTimeWithDelay: PropTypes.number, // time in milliseconds with the delay included
  noDropOff: PropTypes.boolean,
  noPickUp: PropTypes.boolean,
  stationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  stationName: PropTypes.string,
  wheelchairAccessible: PropTypes.boolean,
});

const lineInfos = PropTypes.shape({
  backgroundColor: PropTypes.string,
  bicyclesAllowed: PropTypes.boolean,
  color: PropTypes.string,
  destination: PropTypes.string,
  feedsId: PropTypes.number,
  id: PropTypes.number,
  longName: PropTypes.string,
  operatingInformations: PropTypes.object,
  operator: PropTypes.string,
  operatorTimeZone: PropTypes.string,
  operatorUrl: PropTypes.string,
  realTime: PropTypes.number,
  shortName: PropTypes.string,
  stations: PropTypes.arrayOf(station),
  vehicleType: PropTypes.number,
  wheelchairAccessible: PropTypes.boolean,
});

export default {
  lineInfos,
  station,
};
