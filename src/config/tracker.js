const trackerRaduisMapping = {
  0: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 6, 6, 7, 9, 11],
  1: [1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 11, 11],
  2: [1, 1, 1, 1, 1, 2, 3, 4, 4, 5, 5, 5, 7, 8, 11, 12, 12],
  3: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 4, 6, 7, 8],
  4: [1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 5, 5, 7, 8, 10, 11, 11],
  5: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 9, 11],
  6: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 9, 11],
  7: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 9, 11],
  8: [1, 1, 1, 1, 1, 2, 3, 3, 3, 4, 4, 5, 6, 7, 10, 11, 11],
};

export const getRadius = (type, zoom) => {
  try {
    return trackerRaduisMapping[type][zoom];
  } catch (e) {
    return 1;
  }
};

export const types = [
  'Tram',
  'Subway / Metro / S-Bahn',
  'Train',
  'Bus',
  'Ferry',
  'Cable Car',
  'Gondola',
  'Funicular',
  'Long distance bus',
];

export const bgColors = [
  '#ffb400',
  '#ff5400',
  '#ff8080',
  '#ea0000',
  '#3000ff',
  '#ffb400',
  '#41a27b',
  '#00d237',
  '#b5b5b5',
];

export const textColors = [
  '#000000',
  '#ffffff',
  '#000000',
  '#ffffff',
  '#ffffff',
  '#000000',
  '#ffffff',
  '#000000',
  '#000000',
];

export const timeSteps = [
  100000,
  50000,
  40000,
  30000,
  20000,
  15000,
  10000,
  5000,
  2000,
  1000,
  400,
  300,
  250,
  180,
  90,
  60,
  50,
  40,
  30,
  20,
  20,
];
