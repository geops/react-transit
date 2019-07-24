const { version } = require('./package.json');

module.exports = {
  title: `geOps react-public-transport ${version}`,
  require: ['react-app-polyfill/ie11', 'react-app-polyfill/stable'],
  ribbon: {
    url: 'https://github.com/geops/react-public-transport',
    text: 'Fork me on GitHub',
  },
  sections: [
    {
      name: '',
      context: 'README.md',
    },
    {
      name: 'Components',
      content: 'src/components/Tracker/README.md',
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
};
