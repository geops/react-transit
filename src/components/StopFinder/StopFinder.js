import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MdSearch } from 'react-icons/md';
import { transform as transformCoords } from 'ol/proj';
import Button from 'react-spatial/components/Button';
import AutoComplete from 'react-spatial/components/Autocomplete';
import './StopFinder.scss';

const propTypes = {
  /**
   * CSS class of the wrapper.
   */
  className: PropTypes.string,

  /**
   * Function to be triggered on stop selection.
   */
  onSelect: PropTypes.func.isRequired,

  /**
   * stop finder url.
   */
  stopsUrl: PropTypes.string,

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
  className: 'rt-stop-finder',
  stopsUrl: 'https://api.geops.io/stops/v1/',
  children: <MdSearch />,
  featsProjection: 'EPSG:3857',
  autocompleteProps: {},
  t: t => t,
};

let abortCtrl = new AbortController();

function StopFinder({
  className,
  onSelect,
  stopsUrl,
  apiKey,
  children,
  featsProjection,
  autocompleteProps,
  t,
}) {
  const [input, setInput] = useState('');
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);

  useEffect(() => {
    const url = `${stopsUrl}?&q=${input.toString()}&key=${apiKey}`;

    abortCtrl.abort();
    abortCtrl = new AbortController();
    const { signal } = abortCtrl;

    if (!input) {
      abortCtrl.abort();
      setInput('');
      setStops([]);
      setSelectedStop(null);
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
        setStops(results);
      })
      // eslint-disable-next-line
      .catch(error => console.warn(error));
  }, [input]);

  const renderButton = child => {
    return (
      <Button
        onClick={() => {
          if (selectedStop) {
            if (onSelect) {
              onSelect(selectedStop);
            }
            setStops([]);
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
        items={stops}
        getItemKey={s => s.key}
        renderItem={s => s.name}
        button={renderButton(children)}
        placeholder={`${t('Stations')}...`}
        onChange={val => setInput(val)}
        onSelect={val => {
          setInput(val.name);
          setSelectedStop(val);
          onSelect(val);
        }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...autocompleteProps}
      />
    </div>
  );
}

StopFinder.propTypes = propTypes;
StopFinder.defaultProps = defaultProps;

export default StopFinder;
