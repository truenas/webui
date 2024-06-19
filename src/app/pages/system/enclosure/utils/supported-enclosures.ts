import {
  ES102Model, ES24Model, ES60Model, MSeriesModel,
} from 'app/constants/server-series.constant';

export enum EnclosureSide {
  Front = 'front',
  Rear = 'rear',
  Top = 'top',
  Internal = 'internal',
}

export type EnclosureViews = {
  [key in EnclosureSide]?: string;
};

const mSeries = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/mseries/mseries-front.svg',
  [EnclosureSide.Rear]: 'assets/images/new-hardware/mseries/mseries-rear.svg',
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

export const supportedEnclosures: Record<string, EnclosureViews> = {
  [MSeriesModel.M30]: mSeries,
  [MSeriesModel.M40]: mSeries,
  [MSeriesModel.M50]: mSeries,
  [MSeriesModel.M60]: mSeries,
  [ES24Model.Es24F]: eS24F,
  [ES24Model.Es24N]: eS24N,
  [ES60Model.Es60G2]: eS60G2,
  [ES102Model.Es102G2]: eS102G2,
};
