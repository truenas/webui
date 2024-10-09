import { EnclosureModel } from 'app/enums/enclosure-model.enum';

interface MiniSeries {
  pathImg: string;
  images: string[];
}

export const mSeries = [
  EnclosureModel.M30,
  EnclosureModel.M40,
  EnclosureModel.M50,
  EnclosureModel.M60,
];

export const xSeries = [
  EnclosureModel.X10,
  EnclosureModel.X20,
];

/**
 * @deprecated
 */
export const zSeries = [
  'Z20',
  'Z30',
  'Z35',
  'Z50',
];

export const rSeries = [
  EnclosureModel.R10,
  EnclosureModel.R20,
  EnclosureModel.R20A,
  EnclosureModel.R20B,
  EnclosureModel.R30,
  EnclosureModel.R40,
  EnclosureModel.R50,
  EnclosureModel.R50B,
  EnclosureModel.R50BM,
];

export const fSeries = [
  EnclosureModel.F60,
  EnclosureModel.F100,
  EnclosureModel.F130,
];

export const hSeries = [
  EnclosureModel.H10,
  EnclosureModel.H20,
  EnclosureModel.H30,
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
  },
  miniX: {
    pathImg: 'freenas_mini_x_cropped.png',
    images: [
      'FREENAS-MINI-3.0-X',
      'FREENAS-MINI-3.0-X+',
      'TRUENAS-MINI-3.0-X',
      'TRUENAS-MINI-3.0-X+',
    ],
  },
  miniXL: {
    pathImg: 'freenas_mini_xl_cropped.png',
    images: [
      'FREENAS-MINI-XL',
      'FREENAS-MINI-3.0-XL+',
      'TRUENAS-MINI-3.0-XL+',
    ],
  },
  miniR: {
    pathImg: 'servers/MINI-R.png',
    images: [
      'TRUENAS-MINI-R',
    ],
  },
};
