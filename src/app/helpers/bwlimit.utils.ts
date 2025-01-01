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
      if (getByte(sublimitArr[1]) !== -1) {
        sublimitArr[1] = getByte(sublimitArr[1]).toFixed(0);
      }
    }
    const subLimit: BwLimitUpdate = {
      time: sublimitArr[0],
      bandwidth: sublimitArr[1] === 'off' ? null : sublimitArr[1],
    };

    bwlimtResult.push(subLimit);
  }

  return bwlimtResult;
}
