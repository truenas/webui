export interface AppsFiltersValues {
  sort: AppsFiltersSort | null;
  categories: string[];
}

export enum AppsFiltersSort {
  Name = 'name',
  LastUpdate = '-last_update',
}
