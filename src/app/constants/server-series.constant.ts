interface MiniSeries {
  pathImg: string;
  images: string[];
  isRackmount: boolean;
}

export const serverSeries = [
  'H10',
  'M30',
  'M40',
  'M50',
  'M60',
  'X10',
  'X20',
  'Z20',
  'Z30',
  'Z35',
  'Z50',
  'R10',
  'R20',
  'R30',
  'R40',
  'R50',
  'F60',
  'F100',
  'F130',
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
