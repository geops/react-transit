import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { FaSearch, FaTimes } from 'react-icons/fa';

import SearchService from './SearchService';
import StopFinder from './engines/StopFinder';

const propTypes = {
  engines: PropTypes.object,
  inputProps: PropTypes.object,
  onHighlight: PropTypes.func,
  onSelect: PropTypes.func,
  getRenderSectionTitle: PropTypes.func,
};

const defaultProps = {
  engines: { stops: new StopFinder() },
  onHighlight: () => null,
  onSelect: () => null,
  getRenderSectionTitle: () => () => null,
};

function Search({
  apiKey,
  engines,
  inputProps,
  onHighlight,
  onSelect,
  getRenderSectionTitle,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [value, setValue] = useState('');

  const searchService = useMemo(
    () => new SearchService({ apiKey, engines, setSuggestions }),
    [apiKey, engines, setSuggestions],
  );

  return (
    Object.keys(engines).length > 0 && (
      <div className="rt-search">
        <Autosuggest
          inputProps={{
            autoFocus: true,
            tabIndex: 0,
            onChange: (e, { newValue }) => setValue(newValue),
            onKeyUp: ({ key }) => {
              if (key === 'Enter') {
                const filtered = suggestions.filter(s => s.items.length > 0);
                if (filtered.length > 0) {
                  const { items, section } = filtered[0];
                  searchService.select({ ...items[0], section });
                }
              } else if (key === 'ArrowDown' || key === 'ArrowUp') {
                searchService.highlightSection(); // for improved accessibility
              }
            },
            value,
            ...inputProps,
          }}
          multiSection
          getSectionSuggestions={({ items, section }) =>
            items ? items.map(i => ({ ...i, section })) : []
          }
          getSuggestionValue={suggestion => searchService.value(suggestion)}
          onSuggestionsFetchRequested={() => searchService.search(value)}
          onSuggestionsClearRequested={() => setSuggestions([])}
          onSuggestionHighlighted={({ suggestion }) => onHighlight(suggestion)}
          onSuggestionSelected={(e, { suggestion }) => onSelect(suggestion)}
          renderSuggestion={suggestion => searchService.render(suggestion)}
          renderSectionTitle={getRenderSectionTitle(searchService)}
          shouldRenderSuggestions={newValue => newValue.trim().length > 2}
          suggestions={suggestions}
        />
        {value && (
          <button
            type="button"
            tabIndex={0}
            className="rt-search-button rt-search-button-clear"
            onClick={() => setValue('')}
          >
            <FaTimes />
          </button>
        )}
        <button
          type="button"
          tabIndex={0}
          className="rt-search-button rt-search-button-submit"
        >
          <FaSearch focusable={false} />
        </button>
      </div>
    )
  );
}

Search.propTypes = propTypes;
Search.defaultProps = defaultProps;

export default Search;
