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
}
