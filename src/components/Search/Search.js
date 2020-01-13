import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { FaSearch, FaTimes } from 'react-icons/fa';

import SearchService from './SearchService';
import StopFinder from './engines/StopFinder';

const propTypes = {
  /**
   * Flat object to provide custom search engines: key is the section and value an instance of the Engine class.
   */
  engines: PropTypes.object,

  /**
   * A function which will receive the searchService instance and needs to return a render function for the section title, see [react-autosuggest documentation](https://github.com/moroshko/react-autosuggest#render-section-title-prop) for details.
   */
  getRenderSectionTitle: PropTypes.func,

  /**
   * Props for the search input field, see [react-autosuggest documentation](https://github.com/moroshko/react-autosuggest#input-props-prop) for details.
   */
  inputProps: PropTypes.object,

  /**
   * Callback function which will be called with the hovered suggestion.
   */
  onHighlight: PropTypes.func,

  /**
   * Function to define whether the suggestions are displayed or not.
   * See 'shouldRenderSuggestions' in [react-autosuggest documentation](https://github.com/moroshko/react-autosuggest#input-props-prop) for details.
   */
  shouldRenderSuggestions: PropTypes.func,

  /**
   * Callback function which will be called with the selected suggestion.
   */
  onSelect: PropTypes.func,
};

const defaultProps = {
  engines: { stops: new StopFinder() },
  getRenderSectionTitle: () => () => null,
  onHighlight: () => null,
  shouldRenderSuggestions: newValue => newValue.trim().length > 2,
  onSelect: () => null,
};

function Search({
  apiKey,
  engines,
  getRenderSectionTitle,
  inputProps,
  onHighlight,
  shouldRenderSuggestions,
  onSelect,
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
                if (typeof searchService.highlightSection === 'function') {
                  searchService.highlightSection(); // for improved accessibility
                }
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
          onSuggestionsFetchRequested={({value: newValue}) =>
            searchService.search(suggestion.value)
          }
          onSuggestionsClearRequested={() => setSuggestions([])}
          onSuggestionHighlighted={({ suggestion }) => onHighlight(suggestion)}
          onSuggestionSelected={(e, { suggestion }) => onSelect(suggestion)}
          renderSuggestion={suggestion => searchService.render(suggestion)}
          renderSectionTitle={getRenderSectionTitle(searchService)}
          shouldRenderSuggestions={sug => shouldRenderSuggestions(sug)}
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
