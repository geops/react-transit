import PropTypes from 'prop-types';

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
  stations: PropTypes.arrayOf(
    PropTypes.shape({
      arrivalDelay: PropTypes.number, // time in milliseconds.
      arrivalTime: PropTypes.number, // time in milliseconds.
      cancelled: PropTypes.boolean,
      coordinates: PropTypes.arrayOf(PropTypes.number),
      departureDelay: PropTypes.number, // time in milliseconds.
      departureTime: PropTypes.number, // time in milliseconds.
      noDropOff: PropTypes.boolean,
      noPickUp: PropTypes.boolean,
      stationId: PropTypes.string,
      stationName: PropTypes.string,
      wheelchairAccessible: PropTypes.boolean,
    }),
  ),
  vehiculeType: PropTypes.number,
  wheelchairAccessible: PropTypes.number,
});

export default {
  lineInfos,
};
