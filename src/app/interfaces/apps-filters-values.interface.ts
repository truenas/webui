export interface AppsFiltersValues {
  sort: AppsFiltersSort | null;
  categories: string[] | undefined;
}

export enum AppsFiltersSort {
  Title = 'title',
  LastUpdate = '-last_update',
  PopularityRank = 'popularity_rank',
}
