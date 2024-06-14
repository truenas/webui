interface MiniSeries {
  pathImg: string;
  images: string[];
  isRackmount: boolean;
}

export enum MSeriesModel {
  M30 = 'M30',
  M40 = 'M40',
  M50 = 'M50',
  M60 = 'M60',
}

export const mSeries = [
  'M30',
  'M40',
  'M50',
  'M60',
];

export enum XSeriesModel {
  X10 = 'X10',
  X20 = 'X20',
}

export const xSeries = [
  'X10',
  'X20',
];

export enum ZSeriesModel {
  Z20 = 'Z20',
  Z30 = 'Z30',
  Z35 = 'Z35',
  Z50 = 'Z50',
}

export const zSeries = [
  'Z20',
  'Z30',
  'Z35',
  'Z50',
];

export enum RSeriesModel {
  R10 = 'R10',
  R20 = 'R20',
  R20A = 'R20A',
  R20B = 'R20B',
  R30 = 'R30',
  R40 = 'R40',
  R50 = 'R50',
  R50B = 'R50B',
  // eslint-disable-next-line
  R50BM = 'R50BM',
}

export const rSeries = [
  'R10',
  'R20',
  'R20A',
  'R20B',
  'R30',
  'R40',
  'R50',
  'R50B',
  'R50BM',
];

export enum FSeriesModel {
  F60 = 'F60',
  F100 = 'F100',
  F130 = 'F130',
}

export const fSeries = [
  'F60',
  'F100',
  'F130',
];

export enum HSeriesModel {
  H10 = 'H10',
  H20 = 'H20',
}

export const hSeries = [
  'H10',
  'H20',
];

export const serverSeries = [
  ...hSeries,
  ...mSeries,
  ...xSeries,
  ...zSeries,
  ...rSeries,
  ...fSeries,
];

export const miniSeries: Record<string, MiniSeries> = {
  mini: {
    pathImg: 'freenas_mini_cropped.png',
    images: [
      'FREENAS-MINI-2.0',
      'FREENAS-MINI-3.0-E',
      'FREENAS-MINI-3.0-E+',
      'TRUENAS-MINI-3.0-E',
      'TRUENAS-MINI-3.0-E+',
    ],
    isRackmount: false,
  },
  miniX: {
    pathImg: 'freenas_mini_x_cropped.png',
    images: [
      'FREENAS-MINI-3.0-X',
      'FREENAS-MINI-3.0-X+',
      'TRUENAS-MINI-3.0-X',
      'TRUENAS-MINI-3.0-X+',
    ],
    isRackmount: false,
  },
  miniXL: {
    pathImg: 'freenas_mini_xl_cropped.png',
    images: [
      'FREENAS-MINI-XL',
      'FREENAS-MINI-3.0-XL+',
      'TRUENAS-MINI-3.0-XL+',
    ],
    isRackmount: false,
  },
  miniR: {
    pathImg: 'servers/MINI-R.png',
    images: [
      'TRUENAS-MINI-R',
    ],
    isRackmount: true,
  },
};
