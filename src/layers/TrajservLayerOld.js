import LineString from 'ol/geom/LineString';
import TrajservLayer from './TrajservLayer';

/**
 * Responsible for loading tracker data from Trajserv.
 */
class TrajservLayerOld extends TrajservLayer {
  constructor(options = {}) {
    super({ ...options });
  }

  updateTrajectories() {
    this.fetchTrajectories(
      `${this.url}/trajectories?${this.getUrlParams({
        attr_det: 1,
      })}`,
    ).then(data => {
      // For debug purpose , display the trajectory
      // this.olLayer.getSource().clear();

      this.lastRequestTime = data.t;
      this.currentOffset = data.o || 0;
      const trajectories = [];

      for (let i = 0; i < data.a.length; i += 1) {
        const coords = [];
        const timeIntervals = [];
        let delay = 0;
        const {
          i: id,
          p: paths,
          t: type,
          n: name,
          c: color,
          ag: operator,
        } = data.a[i];

        for (let j = 0; j < paths.length; j += 1) {
          const path = paths[j];
          const startTime = (path[0].a || data.t) * 1000;
          const endTime = (path[path.length - 1].a || data.t + 20) * 1000;

          for (let k = 0; k < path.length; k += 1) {
            // d: delay. When the train is stopped at a station.
            const {
              x,
              y,
              a: timeAtPixelInScds,
              d: delayAtStation,
              ad: arrivalDelay,
            } = path[k];
            // coords.push(this.map.getCoordinateFromPixel([x, y]));
            coords.push([x, y]);

            // If a pixel is defined with a time we add it to timeIntervals.
            if (timeAtPixelInScds) {
              const timeAtPixelInMilliscds = timeAtPixelInScds * 1000;
              const timeFrac = Math.max(
                (timeAtPixelInMilliscds - startTime) / (endTime - startTime),
                0,
              );

              timeIntervals.push([timeAtPixelInMilliscds, timeFrac, null, k]);
              if (delayAtStation) {
                const afterStopTimeInMilliscds =
                  (timeAtPixelInScds + delayAtStation) * 1000;
                timeIntervals.push([
                  afterStopTimeInMilliscds,
                  (afterStopTimeInMilliscds - startTime) /
                    (endTime - startTime),
                  null,
                  k,
                ]);
              }
              // r: makes a difference for the delay, if r is undefined delay is not display, if r exists and different from 0 delay style is displayed
              // if (r && !delay && arrivalDelay >= 0) {
              if (arrivalDelay && arrivalDelay >= 0) {
                delay = arrivalDelay;
              }
            }
          }
        }

        if (coords.length) {
          const geometry = new LineString(coords);
          // For debug purpose , display the trajectory
          // this.olLayer.getSource().addFeatures([new Feature(geometry)]);
          trajectories.push({
            id,
            type,
            name,
            color: color && `#${color}`,
            delay,
            timeOffset: this.currentOffset,
            timeIntervals,
            operator: operator.n,
            geometry,
          });
        }
      }
      this.tracker.setTrajectories(trajectories);
    });
  }
}

export default TrajservLayerOld;
