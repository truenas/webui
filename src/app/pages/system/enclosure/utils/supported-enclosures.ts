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

const eS60G3 = {
  [EnclosureSide.Top]: 'assets/images/new-hardware/es60g3/es60g3-top.svg',
};

const eS102G2 = {
  [EnclosureSide.Top]: 'assets/images/new-hardware/es102g2/es102g2-top.svg',
};

const hSeries = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/h-series/h-series-front.svg',
};

const eS12 = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/es12/es12-front.svg',
};

const eS24 = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/es24/es24-front.svg',
};

const eS60 = {
  [EnclosureSide.Top]: 'assets/images/new-hardware/es60/es60-top.svg',
};

const r10 = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/r10/r10-front.svg',
};

const eS102 = {
  [EnclosureSide.Top]: 'assets/images/new-hardware/es102/es102-top.svg',
};

const mini3e = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/minis/mini-3e-front.svg',
};

const mini3x = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/minis/mini-3x-front.svg',
};

const mini3xlPlus = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/minis/mini-3xl-plus-front.svg',
};

const miniR = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/minis/mini-r-front.svg',
};

const r20 = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/r20/r20-front.svg',
  [EnclosureSide.Rear]: 'assets/images/new-hardware/r20/r20-rear.svg',
};

const r20a = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/r20a/r20a-front.svg',
  [EnclosureSide.Rear]: 'assets/images/new-hardware/r20a/r20a-rear.svg',
};

const r20b = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/r20b/r20b-front.svg',
  [EnclosureSide.Rear]: 'assets/images/new-hardware/r20/r20-rear.svg',
};

const r30 = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/r30/r30-front.svg',
};

const r40 = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/r40/r40-front.svg',
};

const r50 = {
  [EnclosureSide.Top]: 'assets/images/new-hardware/r50/r50-top.svg',
  [EnclosureSide.Rear]: 'assets/images/new-hardware/r50/r50-rear.svg',
};

const r50b = {
  [EnclosureSide.Top]: 'assets/images/new-hardware/r50b/r50b-top.svg',
  [EnclosureSide.Rear]: 'assets/images/new-hardware/r50b/r50b-rear.svg',
};

const r50bm = {
  [EnclosureSide.Rear]: 'assets/images/new-hardware/r50bm/r50bm-rear.svg',
  [EnclosureSide.Top]: 'assets/images/new-hardware/r50bm/r50bm-top.svg',
};

const xSeries = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/x-series/x-series-front.svg',
};

export const supportedEnclosures: Record<string, EnclosureViews> = {
  [EnclosureModel.M30]: mSeries,
  [EnclosureModel.M40]: mSeries,
  [EnclosureModel.M50]: mSeries,
  [EnclosureModel.M60]: mSeries,
  [EnclosureModel.Es24F]: eS24F,
  [EnclosureModel.Es24N]: eS24N,
  [EnclosureModel.Es60G2]: eS60G2,
  [EnclosureModel.Es60G3]: eS60G3,
  [EnclosureModel.Es102G2]: eS102G2,
  [EnclosureModel.F60]: fSeries,
  [EnclosureModel.F100]: fSeries,
  [EnclosureModel.F130]: fSeries,
  [EnclosureModel.H10]: hSeries,
  [EnclosureModel.H20]: hSeries,
  [EnclosureModel.H30]: hSeries,
  [EnclosureModel.Mini3E]: mini3e,
  [EnclosureModel.Mini3EPlus]: mini3e,
  [EnclosureModel.Mini3X]: mini3x,
  [EnclosureModel.Mini3XPlus]: mini3x,
  [EnclosureModel.Mini3XlPlus]: mini3xlPlus,
  [EnclosureModel.MiniR]: miniR,
  [EnclosureModel.Es12]: eS12,
  [EnclosureModel.Es24]: eS24,
  [EnclosureModel.Es60]: eS60,
  [EnclosureModel.Es102]: eS102,
  [EnclosureModel.R10]: r10,
  [EnclosureModel.R20]: r20,
  [EnclosureModel.R20A]: r20a,
  [EnclosureModel.R20B]: r20b,
  [EnclosureModel.R30]: r30,
  [EnclosureModel.R40]: r40,
  [EnclosureModel.R50]: r50,
  [EnclosureModel.R50B]: r50b,
  [EnclosureModel.R50BM]: r50bm,
  [EnclosureModel.X10]: xSeries,
  [EnclosureModel.X20]: xSeries,
};
