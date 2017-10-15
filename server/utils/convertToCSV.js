export const convertToCSV = (objArray) => {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  let str = '';

  for (let i = 0; i < array.length; i++) {
    let line = '';
    for (const index in array[i]) { // eslint-disable-line no-restricted-syntax
      if (line !== '') {
        line += ',';
      }
      line += array[i][index];
    }

    str += `${line}\r\n`;
  }

  return str;
};

export default convertToCSV;
