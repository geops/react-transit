const path = require('path');
const { version } = require('./package.json');

module.exports = {
  version,
  template: {
    favicon: 'images/favicon.png',
  },
  assetsDir: 'src/',
  styleguideDir: 'styleguide-build',
  require: [
    path.join(__dirname, 'src/themes/default/examples.scss'),
    path.join(__dirname, 'src/styleguidist/styleguidist.css'),
    'react-app-polyfill/ie11',
    'react-app-polyfill/stable',
    'abortcontroller-polyfill/dist/abortcontroller-polyfill-only',
  ],
  ribbon: {
    url: 'https://github.com/geops/react-transit',
    text: 'Fork me on GitHub',
  },
  moduleAliases: {
    'react-transit': path.resolve(__dirname, 'src'),
  },
  sections: [
    {
      name: '',
      context: 'README.md',
    },
    {
      name: 'Components',
      components: [
        'src/components/RouteSchedule/[A-Z]*.js',
        'src/components/TrackerControl/[A-Z]*.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'collapse',
    },
  ],
  webpackConfig: {
    module: {
      rules: [
        // Babel loader, will use your project’s .babelrc
        // Transpile node dependencies, node deps are often not transpiled for IE11
        {
          test: [
            /\/node_modules\/(regexpu-core|unicode-.*|chalk|acorn-.*|query-string|strict-uri-encode)/,
            /\/node_modules\/(split-on-first|react-dev-utils|ansi-styles|jsts|estree-walker|strip-ansi)/,
          ],
          loader: 'babel-loader',
        },
        // Transpile js
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        // Load css and scss files.
        {
          test: /\.s?css$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /^((?!url).)*\.svg$/,
          use: [
            {
              loader: 'babel-loader',
            },
            {
              loader: 'react-svg-loader',
              options: {
                jsx: true, // true outputs JSX tags
              },
            },
          ],
        },
        {
          test: /\.url\.svg$/,
          loader: 'url-loader',
        },
        {
          test: /\.png$/,
          use: [
            {
              loader: 'url-loader',
            },
          ],
        },
      ],
    },
  },
  styles: {
    StyleGuide: {
      '@global body': {
        overflowY: 'hidden',
        overflowX: 'hidden',
      },
    },
  },
  showSidebar: true,
  styleguideComponents: {
    ComponentsList: path.join(__dirname, 'src/styleguidist/ComponentsList'),
    StyleGuideRenderer: path.join(__dirname, 'src/styleguidist/StyleGuide'),
  },
};
