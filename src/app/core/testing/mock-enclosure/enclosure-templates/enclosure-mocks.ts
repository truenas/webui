import {
  mockEs102,
  mockEs102G2,
  mockEs12,
  mockEs24,
  mockEs24F, mockEs24N, mockEs60, mockEs60G2,
} from 'app/core/testing/mock-enclosure/enclosure-templates/mock-expansion-shelves';
import { mockF100, mockF130, mockF60 } from 'app/core/testing/mock-enclosure/enclosure-templates/mock-f-series';
import { mockM40, mockM50, mockM60 } from 'app/core/testing/mock-enclosure/enclosure-templates/mock-m-series';
import {
  mockMini3E,
  mockMini3EPlus, mockMini3X, mockMini3XlPlus,
  mockMini3XPlus, mockMiniR,
} from 'app/core/testing/mock-enclosure/enclosure-templates/mock-minis';
import {
  mockR10,
  mockR20, mockR20A, mockR20B,
  mockR30,
  mockR40,
  mockR50, mockR50B, mockR50Bm,
} from 'app/core/testing/mock-enclosure/enclosure-templates/mock-r-series';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

export const enclosureMocks: DashboardEnclosure[] = [
  mockF60,
  mockF100,
  mockF130,

  mockM40,
  mockM50,
  mockM60,

  mockMini3E,
  mockMini3EPlus,
  mockMini3X,
  mockMini3XPlus,
  mockMini3XlPlus,
  mockMiniR,

  mockR10,
  mockR20,
  mockR20A,
  mockR20B,
  mockR30,
  mockR40,
  mockR50,
  mockR50B,
  mockR50Bm,

  mockEs12,
  mockEs24,
  mockEs24F,
  mockEs24N,
  mockEs60,
  mockEs60G2,
  mockEs102,
  mockEs102G2,
];
