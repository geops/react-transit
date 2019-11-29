import React from 'react';

import Engine from './Engine';

class StopFinder extends Engine {
  constructor(endpoint = 'https://api.geops.io/stops/v1/') {
    super();
    this.endpoint = endpoint;
  }

  search(value) {
    return fetch(`${this.endpoint}?&q=${value}&key=${this.apiKey}`)
      .then(data => data.json())
      .then(featureCollection => featureCollection.features);
  }

  render(item) {
    return <div>{item.properties.name}</div>;
  }

  static value(item) {
    return item.properties.name;
  }
}

export default StopFinder;
