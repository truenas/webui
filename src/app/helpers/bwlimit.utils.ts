import {
  TiB, GiB, MiB, KiB,
  PiB,
} from 'app/constants/bytes.constant';
import { BwLimitUpdate } from 'app/interfaces/cloud-sync-task.interface';

const byteMap = {
  P: PiB,
  T: TiB,
  G: GiB,
  M: MiB,
  K: KiB,
  B: 1,
};

function getByte(data: string): number {
  let unit: keyof typeof byteMap = 'B'; // default unit
  let index = -1;

  for (let i = 0; i < data.length; i++) {
    if (Object.keys(byteMap).includes(data[i].toUpperCase())) {
      unit = data[i].toUpperCase() as keyof typeof byteMap;
      index = i;
      break;
    }
  }
  const restUnit = data.slice(index + 1, data.length).toUpperCase();
  if (index === -1 && Number(data)) {
    return Number(data) * byteMap[unit];
  }
  if (restUnit === 'IB' || restUnit === 'B' || restUnit === '') {
    if (unit === 'B' && restUnit !== '') {
      return -1;
    }
    return Number(data.slice(0, index)) * byteMap[unit];
  }
  return -1;
}

/**
 * takes a list of strings like '09:00,100M' or '23:30,off' and returns a list of
 * `BwLimitUpdate`. the return value has the following properties:
 *   * `time` is a string like '09:00' or '23:30'. technically-invalid values like
 *     '36:00' are still returned from the function to be
 *     submitted (and rejected) to the API.
 *   * `bandwidth` is a number or null including `NaN` representing total bytes. (i.e. 1000 instead of 1K)
 *   * if `bandwidth` is `NaN`, then the actual bandwidth speed specification was *not valid*. it is
 *     **on the caller to handle returned NaN values** so as to distinguish between deliberately
 *     `null` values and invalid values.
 */
export function prepareBwlimit(bwlimit: string[] | undefined): BwLimitUpdate[] {
  const bwlimtResult: BwLimitUpdate[] = [];

  if (!bwlimit?.length) {
    return bwlimtResult;
  }

  for (const limit of bwlimit) {
    const sublimitArr = limit.split(/\s*,\s*/);
    if (sublimitArr.length === 1 && bwlimit.length === 1 && !sublimitArr[0].includes(':')) {
      sublimitArr.unshift('00:00');
    }
    if (sublimitArr[1] && sublimitArr[1] !== 'off') {
      if (sublimitArr[1].toLowerCase().endsWith('/s')) {
        sublimitArr[1] = sublimitArr[1].substring(0, sublimitArr[1].length - 2);
      }
      // note: `sublimitArr[1]` is *not* set if `getByte` fails, which leaves it as the original string.
      if (getByte(sublimitArr[1]) !== -1) {
        sublimitArr[1] = getByte(sublimitArr[1]).toFixed(0);
      }
    }
    let parsedBandwidth: number | null;
    if (sublimitArr[1] === 'off' || sublimitArr[1] === undefined) {
      parsedBandwidth = null;
    } else {
      // validate that the `parsed` string is a number *if it isn't `off` or not there at all (`undefined`)*.
      // this returns `NaN` if we're unable to convert it into a number, so strings like 'abc' or '1o0'
      // don't slip by.
      parsedBandwidth = Number(sublimitArr[1]);
    }
    const subLimit: BwLimitUpdate = {
      time: sublimitArr[0],
      bandwidth: parsedBandwidth,
    };

    bwlimtResult.push(subLimit);
  }

  return bwlimtResult;
}
