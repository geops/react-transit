import React from 'react';
import renderer from 'react-test-renderer';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import TrajservLayer from '../../layers/TrajservLayer';
import FollowButton from '.';

configure({ adapter: new Adapter() });

const funcs = {
  onClick: () => {},
};

const trackerLayer = new TrajservLayer();

test('FollowButton should match snapshot.', () => {
  const component = renderer.create(
    <FollowButton
      className="rt-follow-button"
      title="Follow up"
      active={false}
      setActive={() => {}}
      routeIdentifier="test"
      trackerLayer={trackerLayer}
      setCenter={() => funcs.onClick()}
    />,
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('FollowButton should toggle.', () => {
  let followActive = false;
  const setFollowActive = () => {
    followActive = !followActive;
  };
  const bt = shallow(
    <FollowButton
      className="rt-follow-button"
      title="Follow up"
      active={followActive}
      setActive={active => setFollowActive(active)}
      routeIdentifier="test"
      trackerLayer={trackerLayer}
      setCenter={() => funcs.onClick()}
    />,
  );

  expect(followActive).toBe(false);

  bt.find('.rt-follow-button')
    .first()
    .simulate('click');

  expect(followActive).toBe(true);

  bt.find('.rt-follow-button')
    .first()
    .simulate('click');

  expect(followActive).toBe(false);
});
