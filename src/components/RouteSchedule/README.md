#

This demonstrates the use of RouteSchedule.

```jsx
import React from 'react';
import Dialog from 'react-spatial/components/Dialog';
import BasicMap from 'react-spatial/components/BasicMap';
import Layer from 'react-spatial/Layer';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import TrajservLayer from 'react-transit/layers/TrajservLayer';
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
      new TrajservLayer({
        onClick: trajectory => {
          this.setState({
            isRouteScheduleOpen: true,
            lineInfos: trajectory,
          });
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
          classNameChildren="rt-route-dialog-children"
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
