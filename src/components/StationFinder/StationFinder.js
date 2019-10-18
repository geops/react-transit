import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MdSearch } from 'react-icons/md';
import { transform as transformCoords } from 'ol/proj';
import Button from 'react-spatial/components/Button';
import AutoComplete from 'react-spatial/components/Autocomplete';
import './StationFinder.scss';

const propTypes = {
  /**
   * CSS class of the wrapper.
   */
  className: PropTypes.string,

  /**
   * Function to be triggered on station selection.
   */
  onSelect: PropTypes.func.isRequired,

  /**
   * Station finder url.
   */
  stationsUrl: PropTypes.string,

  /**
   * Access key for [geOps services](https://developer.geops.io/).
   */
  apiKey: PropTypes.string.isRequired,

  /**
   *  Projection to used for features transformation.
   */
  featsProjection: PropTypes.string,

  /**
   *  Children content of the search Button.
   */
  children: PropTypes.node,

  /**
   * Object with props to be passed to children [Autocomplete](https://react-spatial.geops.de/#!/Autocomplete) from react-spatial.
   */
  autocompleteProps: PropTypes.object,

  /**
   * Translation function returning the translated string.
   */
  t: PropTypes.func,
};

const defaultProps = {
  className: 'rt-station-finder',
  stationsUrl: 'https://api.geops.io/stops/v1/',
  children: <MdSearch />,
  featsProjection: 'EPSG:3857',
  autocompleteProps: {},
  t: t => t,
};

let abortCtrl = new AbortController();

function StationFinder({
  className,
  onSelect,
  stationsUrl,
  apiKey,
  children,
  featsProjection,
  autocompleteProps,
  t,
}) {
  const [input, setInput] = useState('');
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    const url = `${stationsUrl}?&q=${input.toString()}&key=${apiKey}`;

    abortCtrl.abort();
    abortCtrl = new AbortController();
    const { signal } = abortCtrl;

    if (!input) {
      abortCtrl.abort();
      setInput('');
      setStations([]);
      setSelectedStation(null);
      return;
    }

    setInput(input);
    fetch(url, { signal })
      .then(response => response.json())
      .then(data => {
        const results = data.features
          ? data.features.map((f, index) => {
              return {
                key: index,
                name: f.properties.name,
                coordinates: transformCoords(
                  f.geometry.coordinates,
                  'EPSG:4326',
                  featsProjection,
                ),
              };
            })
          : [];
        return results;
      })
      .then(results => {
        setStations(results);
      })
      // eslint-disable-next-line
      .catch(error => console.warn(error));
  }, [input]);

  const renderButton = child => {
    return (
      <Button
        onClick={() => {
          if (selectedStation) {
            if (onSelect) {
              onSelect(selectedStation.coordinates);
            }
            setStations([]);
          }
        }}
      >
        {child}
      </Button>
    );
  };

  return (
    <div className={className}>
      <AutoComplete
        value={input}
        items={stations}
        getItemKey={s => s.key}
        renderItem={s => s.name}
        button={renderButton(children)}
        placeholder={`${t('Stations')}...`}
        onChange={val => setInput(val)}
        onSelect={val => {
          setInput(val.name);
          setSelectedStation(val);
          onSelect(val.coordinates);
        }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...autocompleteProps}
      />
    </div>
  );
}

StationFinder.propTypes = propTypes;
StationFinder.defaultProps = defaultProps;

export default StationFinder;
