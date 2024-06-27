import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AppExtraCategory {
  NewAndUpdated = 'new-and-updated',
  Recommended = 'recommended',
  All = 'all',
}

export const appExtraCategoryLabels = new Map([
  [AppExtraCategory.NewAndUpdated, T('New & Updated Apps')],
  [AppExtraCategory.Recommended, T('Recommended Apps')],
]);
