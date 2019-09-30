import PropTypes from 'prop-types';

const lineInfos = PropTypes.shape({
  backgroundColor: PropTypes.string,
  bicyclesAllowed: PropTypes.number,
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
      arrivalDate: PropTypes.number, // time in milliseconds.
      arrivalDelay: PropTypes.number, // time in milliseconds.
      arrivaleTime: PropTypes.number, // time in milliseconds.
      cancelled: PropTypes.number,
      coordinates: PropTypes.arrayOf(PropTypes.number),
      departureDate: PropTypes.number, // time in milliseconds.
      departureDelay: PropTypes.number, // time in milliseconds.
      departureTime: PropTypes.number, // time in milliseconds.
      noDropOff: PropTypes.number,
      noPickUp: PropTypes.number,
      stationId: PropTypes.string,
      stationName: PropTypes.string,
      wheelchairAccessible: PropTypes.number,
    }),
  ),
  vehiculeType: PropTypes.number,
  wheelchairAccessible: PropTypes.number,
});

export default {
  lineInfos,
};
