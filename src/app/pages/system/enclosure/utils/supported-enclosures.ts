import { MSeriesModel } from 'app/constants/server-series.constant';

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

export const supportedEnclosures: Record<string, EnclosureViews> = {
  [MSeriesModel.M30]: mSeries,
  [MSeriesModel.M40]: mSeries,
  [MSeriesModel.M50]: mSeries,
  [MSeriesModel.M60]: mSeries,
};
