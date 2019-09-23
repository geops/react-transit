import React from 'react';
import renderer from 'react-test-renderer';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import TrajservLayer from '../../layers/TrajservLayer';
import FilterButton from '.';

configure({ adapter: new Adapter() });
const trackerLayer = new TrajservLayer();

test('FollowButton should match snapshot.', () => {
  const component = renderer.create(
    <FilterButton
      className="rt-filter-button"
      title="Filter up"
      routeIdentifier="test"
      trackerLayer={trackerLayer}
    />,
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('FollowButton should toggle.', () => {
  const bt = shallow(
    <FilterButton
      className="rt-filter-button"
      routeIdentifier="test"
      trackerLayer={trackerLayer}
    />,
  );

  expect(bt.state('filterActivated')).toBe(false);

  bt.find('.rt-filter-button')
    .first()
    .simulate('click');

  expect(bt.state('filterActivated')).toBe(true);

  bt.find('.rt-filter-button')
    .first()
    .simulate('click');

  expect(bt.state('filterActivated')).toBe(false);
});
