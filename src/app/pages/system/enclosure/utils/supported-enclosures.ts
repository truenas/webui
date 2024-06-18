import { ES24Model, MSeriesModel } from 'app/constants/server-series.constant';

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

const es24f = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/es24f/es24f-front.svg',
};

const es24n = {
  [EnclosureSide.Front]: 'assets/images/new-hardware/es24n/es24n-front.svg',
};

export const supportedEnclosures: Record<string, EnclosureViews> = {
  [MSeriesModel.M30]: mSeries,
  [MSeriesModel.M40]: mSeries,
  [MSeriesModel.M50]: mSeries,
  [MSeriesModel.M60]: mSeries,
  [ES24Model.ES24F]: es24f,
  [ES24Model.ES24N]: es24n,

};
