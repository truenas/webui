import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export enum EnclosureSide {
  Front = 'front',
  Rear = 'rear',
  Top = 'top',
  Internal = 'internal',
}

export type EnclosureViews = {
  [key in EnclosureSide]?: string;
};

const fSeries = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/f-series/f-series-front.svg',
};

const mSeries = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/m-series/m-series-front.svg',
  [EnclosureSide.Rear]: 'assets/images/new-hardware/m-series/m-series-rear.svg',
};

const eS24F = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/es24f/es24f-front.svg',
};

const eS24N = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/es24n/es24n-front.svg',
};

const eS60G2 = {
  [EnclosureSide.Top]: 'assets/images/new-hardware/es60g2/es60g2-top.svg',
};

const eS102G2 = {
  [EnclosureSide.Top]: 'assets/images/new-hardware/es102g2/es102g2-top.svg',
};

const hSeries = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/h-series/h-series-front.svg',
};

const mini3E = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/minis/mini-3-e-front.svg',
};

const mini3X = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/minis/mini-3-x-front.svg',
};

const mini3Xl = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/minis/mini-3-xl-front.svg',
};

const eS12 = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/es12/es12-front.svg',
};

const eS24 = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/es24/es24-front.svg',
};

export const supportedEnclosures: Record<string, EnclosureViews> = {
  [EnclosureModel.M30]: mSeries,
  [EnclosureModel.M40]: mSeries,
  [EnclosureModel.M50]: mSeries,
  [EnclosureModel.M60]: mSeries,
  [EnclosureModel.Es24F]: eS24F,
  [EnclosureModel.Es24N]: eS24N,
  [EnclosureModel.Es60]: eS60G2,
  [EnclosureModel.Es60G2]: eS60G2,
  [EnclosureModel.Es102]: eS102G2,
  [EnclosureModel.Es102G2]: eS102G2,
  [EnclosureModel.F60]: fSeries,
  [EnclosureModel.F100]: fSeries,
  [EnclosureModel.F130]: fSeries,
  [EnclosureModel.H10]: hSeries,
  [EnclosureModel.H20]: hSeries,
  [EnclosureModel.Mini3E]: mini3E,
  [EnclosureModel.Mini3EPlus]: mini3E,
  [EnclosureModel.Mini3X]: mini3X,
  [EnclosureModel.Mini3XPlus]: mini3X,
  [EnclosureModel.Mini3XlPlus]: mini3Xl,
  [EnclosureModel.Es12]: eS12,
  [EnclosureModel.Es24]: eS24,
};
