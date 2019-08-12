#

This demonstrates the use of RouteSchedule.

```jsx
import React from 'react';
import Dialog from 'react-spatial/components/Dialog';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrackerLayer from 'react-transit/components/Tracker/TrackerLayer';
import RouteSchedule from 'react-transit/components/RouteSchedule';

class BasicMapExample extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isRouteScheduleOpen: false,
      lineInfos: null,
    };

    this.layers = [
      new Layer({
        name: 'Layer',
        olLayer: new TileLayer({
          source: new OSMSource(),
        }),
      }),
      new TrackerLayer({
        onClick: e => {
          if (e && 'sts' in e) {
            this.setState({
              isRouteScheduleOpen: true,
              lineInfos: e,
            });
          }
        },
      }),
    ];
  }

  toggleRouteSchedule() {
    const { isRouteScheduleOpen } = this.state;
    this.setState({
      isRouteScheduleOpen: !isRouteScheduleOpen,
    });
  }

  render() {
    const { lineInfos, isRouteScheduleOpen } = this.state;

    return (
      <div className="rt-route-schedule-example">
        <BasicMap center={[951560, 6002550]} zoom={14} layers={this.layers} />
        <Dialog
          className="rt-route-dialog"
          classNameChildren="rt-route-dialog-2"
          onClose={() => this.toggleRouteSchedule()}
          isOpen={isRouteScheduleOpen}
        >
          <RouteSchedule lineInfos={lineInfos} />
        </Dialog>
      </div>
    );
  }
}

<BasicMapExample />;
```
