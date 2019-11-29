class SearchService {
  constructor({ apiKey, engines, setSuggestions }) {
    this.engines = engines;
    this.setSuggestions = setSuggestions;
    Object.entries(this.engines).forEach(([, e]) => e.setApiKey(apiKey));
  }

  search(value) {
    Object.entries(this.engines).forEach(([section, engine], position) => {
      engine.search(value).then(items => {
        engine.setItems(items);
        this.upsert(section, engine.getItems(items), position);
      });
    });
  }

  render(item) {
    return this.engines[item.section].render(item);
  }

  select(item) {
    this.engines[item.section].select(item);
    this.highlight(item, true);
  }

  countItems(section) {
    return this.engines[section].items && this.engines[section].items.length;
  }

  toggleSection(toggledSection) {
    Object.entries(this.engines).forEach(([section, engine], position) => {
      engine.collapse(!(section === toggledSection && engine.collapsed));
      this.upsert(section, engine.getItems(), position);
    });
  }

  sectionCollapsed(section) {
    return this.engines[section].collapsed;
  }

  upsert(section, items, position) {
    this.setSuggestions(oldSuggestions => {
      const sectionIndex = oldSuggestions.findIndex(s => s.section === section);
      const start = sectionIndex === -1 ? position : sectionIndex;
      const deleteCount = sectionIndex === -1 ? 0 : 1;
      const newSuggestions = [...oldSuggestions];
      newSuggestions.splice(start, deleteCount, { section, items });
      return newSuggestions;
    });
  }

  value(item) {
    return this.engines[item.section].constructor.value(item);
  }
}

export default SearchService;
