// Get a Date object as date string .
// ex: 2019 09 01
export const getDateString = now => {
  const n = now || new Date();
  let month = (n.getMonth() + 1).toString();
  month = month.length === 1 ? `0${month}` : month;
  let day = n.getDate().toString();
  day = day.length === 1 ? `0${day}` : day;

  return [now.getFullYear(), month, day].join('');
};

// Get the time string of Date object.
// ex: 09:05:01.123
export const getTimeString = time => {
  return [
    time.getHours() - 2,
    time.getMinutes(),
    `${time.getSeconds()}.${time.getMilliseconds()}`,
  ].join(':');
};
