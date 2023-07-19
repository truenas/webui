// eslint-disable-next-line @typescript-eslint/naming-convention
export const NULL_VALUE = 'null_value';

export interface ItemBeforeFlattening {
  id: string | number;
  children?: ItemBeforeFlattening[];
  [key: string]: unknown;
}

type DataBeforeFlattening = ItemBeforeFlattening | ItemBeforeFlattening[];

export interface FlattenedData extends Record<string, unknown> {
  _level?: number;
  _parent?: string | number;
}

export class EntityUtils {
  isObject = (something: unknown): something is Record<string, unknown> => {
    return (!!something) && (something.constructor === Object);
  };

  flattenData(data: DataBeforeFlattening, level = 0, parent?: { id: string | number }): FlattenedData[] {
    let ndata: FlattenedData[] = [];
    if (this.isObject(data)) {
      data = [data];
    }
    data.forEach((item) => {
      (item as FlattenedData)._level = level;
      if (parent) {
        (item as FlattenedData)._parent = parent.id;
      }
      ndata.push(item);
      if (item.children) {
        ndata = ndata.concat(this.flattenData(item.children, level + 1, item));
      }
      delete item.children;
    });
    return ndata;
  }

  /**
   * make cron time dow consistence
   */
  parseDow(cron: string): string {
    const dowOptions = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const cronArray = cron.replace(/00/g, '0').split(' ');
    if (cronArray[cronArray.length - 1] !== '*') {
      cronArray[cronArray.length - 1] = cronArray[cronArray.length - 1]
        .split(',')
        // TODO: Probably a bug
        .map((element) => dowOptions[Number(element)] || element)
        .join(',');
    }
    return cronArray.join(' ');
  }

  filterArrayFunction(item: unknown): boolean {
    /**
     * This function is for validation.
     * If the value of a control is invaild, we ignore it during sending payload
     */
    let result = true;
    if (item === undefined || item === null || item === '') {
      result = false;
    } else if (Array.isArray(item)) {
      let isAllEmpty = true;
      item.forEach((subValue) => {
        if (this.filterArrayFunction(subValue)) {
          isAllEmpty = false;
        }
      });
      if (isAllEmpty) {
        result = false;
      }
    } else if (typeof item === 'object') {
      let isAllEmpty = true;
      Object.values(item).forEach((value) => {
        if (this.filterArrayFunction(value)) {
          isAllEmpty = false;
        }
      });
      if (isAllEmpty) {
        result = false;
      }
    }

    return result;
  }

  changeNullString2Null(data: unknown): unknown {
    let result: unknown;
    if (data === undefined || data === null || data === '') {
      result = data;
    } else if (Array.isArray(data)) {
      result = data.map((item) => this.changeNullString2Null(item));
    } else if (typeof data === 'object') {
      result = {};
      Object.keys(data).forEach((key) => {
        const value = this.changeNullString2Null((data as Record<string, unknown>)[key]);
        (result as Record<string, unknown>)[key] = value;
      });
    } else if (data === NULL_VALUE) {
      result = null;
    } else {
      result = data;
    }

    return result;
  }
}
