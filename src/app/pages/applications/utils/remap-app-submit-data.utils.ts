export function remapAppSubmitData(data: any): any {
  let result: any;
  if (data === undefined || data === null || data === '') {
    result = data;
  } else if (Array.isArray(data)) {
    result = data.map((item) => {
      if (Object.keys(item).length > 1) {
        return remapAppSubmitData(item);
      }
      return remapAppSubmitData(item[Object.keys(item)[0]]);
    });
  } else if (typeof data === 'object') {
    result = {};
    Object.keys(data).forEach((key) => {
      result[key] = remapAppSubmitData(data[key]);
    });
  } else {
    result = data;
  }

  return result;
}
