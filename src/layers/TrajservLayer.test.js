import 'jest-canvas-mock';
// import Map from 'ol/Map';
// import View from 'ol/View';
import TrajservLayer from './TrajservLayer';

let layer;
// let map;
let onClick;

describe('VectorLayer', () => {
  beforeEach(() => {
    onClick = jest.fn();
    layer = new TrajservLayer({
      onClick,
    });
    // map = new Map({ view: new View({ resution: 5 }) });
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(TrajservLayer);
    expect(layer.clickCallbacks[0]).toBe(onClick);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'terminate');
    layer.init();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  /* test('should add the layer on initialization.', () => {
    const spy = jest.spyOn(map, 'addLayer');
    layer.init(map);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(layer.olLayer);
  }); */
});
