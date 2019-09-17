# Develop

## Create new component

Follow the [guidelines](https://github.com/geops/react-transit/tree/master/src/components).

## Create new theme

Follow the [guidelines](https://github.com/geops/react-transit/tree/master/src/themes).

## Documentation

We are using [react-styleguidist](https://react-styleguidist.js.org/), and [documentation.js](https://documentation.js.org/)
Documentation and examples are available [here](https://react-transit.geops.de).

Build the doc:

```bash
yarn doc
```

this command creates the component documentation with react-styleguidist, and the layer documentation with documentation.js.
When the command finishes executing, run a local server in /doc/build folder.
Run the doc on [`locahost:6060`](http://locahost:6060/):

- [Documentation](https://github.com/geops/react-transit/blob/master/doc/README.md)

```bash
yarn start
```

## Tests

We are using [jest]([https://react-styleguidist.js.org/](https://jestjs.io/docs/en/getting-started.html)) and [enzyme]([https://github.com/airbnb/enzyme](https://airbnb.io/enzyme/)).

Run the tests in watch mode:

```bash
yarn test --watch
```

## Coverage

Run coverage:

```bash
yarn coverage
```

Then open the file `coverage/lcov-report/index.html` in your browser.

## Publish on [npmjs.com](https://www.npmjs.com/package/react-transit)

Run publish:

```bash
publish:public
```
You need to enter the new version number in the command line.
Then the new version must be published on [npmjs.com](https://www.npmjs.com/package/react-transit).

## Publish a development version on [npmjs.com](https://www.npmjs.com/package/react-transit)

This version WILL NOT be displayed to other in [npmjs.com](https://www.npmjs.com/package/react-transit).

Run publish:

```bash
publish:beta
```

You need to enter the new version number in the command line.
Append `-beta.0` to the current version or increase the beta number.
Then the new version must be published on [npmjs.com](https://www.npmjs.com/package/react-transit) with the tag beta.