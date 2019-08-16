import React from 'react';
import renderer from 'react-test-renderer';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import TrackerControl from '.';

configure({ adapter: new Adapter() });

describe('TrackerControl', () => {
  test('matches snapshots.', () => {
    const component = renderer.create(<TrackerControl />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
