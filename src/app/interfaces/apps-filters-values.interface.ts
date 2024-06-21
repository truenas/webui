export interface AppsFiltersValues {
  sort: AppsFiltersSort;
  categories: string[];
}

export enum AppsFiltersSort {
  Name = 'name',
  LastUpdate = '-last_update',
}
