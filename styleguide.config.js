const path = require('path');
const { version } = require('./package.json');

module.exports = {
  version,
  require: [
    path.join(__dirname, 'src/themes/default/examples.scss'),
    path.join(__dirname, 'src/styleguidist/styleguidist.css'),
    'react-app-polyfill/ie11',
    'react-app-polyfill/stable',
  ],
  styleguideDir: 'styleguide-build',
  ribbon: {
    url: 'https://github.com/geops/react-public-transport',
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
      name: 'Basic usage',
      content: 'src/layers/README.md',
    },
    {
      name: 'Components',
      components: [
        'src/components/RouteSchedule/[A-Z]*.js',
        'src/components/TrackerControl/[A-Z]*.js',
      ],
      exampleMode: 'expand',
      usageMode: 'collapse',
    },
  ],
  webpackConfig: {
    module: {
      rules: [
        // Babel loader, will use your project’s .babelrc
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        // Load css and scss files.
        {
          test: /\.s?css$/,
          use: ['style-loader', 'css-loader', 'sass-loader?modules'],
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
