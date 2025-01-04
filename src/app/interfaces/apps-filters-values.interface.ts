export interface AppsFiltersValues {
  sort: AppsFiltersSort | null;
  categories: string[] | undefined;
}

export enum AppsFiltersSort {
  Name = 'name',
  LastUpdate = '-last_update',
}
