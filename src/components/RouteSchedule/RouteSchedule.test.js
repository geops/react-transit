import React from 'react';
import renderer from 'react-test-renderer';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import RouteSchedule from '.';

configure({ adapter: new Adapter() });

const lineInfos = {
  c: 'ff8a00',
  fid: 580,
  hs: 'Station name',
  id: 9959310,
  ln: 'T 3',
  rt: 0,
  sn: '3',
  sts: [
    {
      ap: 1565596620,
      at: 358200000,
      dot: 0,
      dp: 1565596620,
      dt: 358200000,
      n: 'first stop',
      p: [8.51772, 47.3586],
      put: 0,
      sid: '1',
      wa: 0,
    },
    {
      ap: 1565597280,
      at: 364800000,
      dot: 0,
      dp: 1565597280,
      dt: 364800000,
      n: 'second stop',
      p: [8.54119, 47.36646],
      put: 0,
      sid: '2',
      wa: 0,
    },
  ],
  t: 0,
  tc: '',
  wa: 0,
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
