export interface AppsFiltersValues {
  search: string;
  catalogs: string[];
  sort: AppsFiltersSort;
  categories: string[];
}

export enum AppsFiltersSort {
  Name = 'name',
  Catalog = 'catalog',
  LastUpdate = '-last_update',
}
