import 'jest-canvas-mock';
import WS from 'jest-websocket-mock';
import TralisLayer from './TralisLayer';
import TralisAPI from '../utils/TralisAPI';

let layer;
let server;

describe('TralisLayer', () => {
  beforeEach(() => {
    // create a WS instance, listening on port 1234 on localhost
    server = new WS('ws://localhost:1234');
    layer = new TralisLayer({ url: 'ws://foo.ch' });
  });

  afterEach(() => {
    server.close();
    WS.clean();
  });

  test('should be instanced.', () => {
    expect(layer).toBeInstanceOf(TralisLayer);
    expect(layer.api).toBeInstanceOf(TralisAPI);
  });

  test('should called terminate on initalization.', () => {
    const spy = jest.spyOn(layer, 'terminate');
    layer.init();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
