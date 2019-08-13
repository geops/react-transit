import React from 'react';
import renderer from 'react-test-renderer';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import RouteSchedule from '.';

configure({ adapter: new Adapter() });

const lineInfos = {
  backgroundColor: 'ff8a00',
  destination: 'Station name',
  id: 9959310,
  longName: 'T 3',
  shortName: '3',
  stations: [
    {
      stationId: '1',
      stationName: 'first stop',
      coordinates: [8.51772, 47.3586],
      arrivalDelay: 60000,
      arrivalTime: 603000000,
      departureDelay: 60000,
      departureTime: 603000000,
    },
    {
      stationId: '2',
      stationName: 'second stop',
      coordinates: [8.54119, 47.36646],
      arrivalDelay: 120000,
      arrivalTime: 609000000,
      departureDelay: 120000,
      departureTime: 609000000,
    },
  ],
  vehiculeType: 0,
};

describe('RouteSchedule', () => {
  test('matches snapshots.', () => {
    const component = renderer.create(<RouteSchedule lineInfos={lineInfos} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  // to test: on station click
  // to test: time formating
  // to test: delay formating
  // to test: delay color
});
