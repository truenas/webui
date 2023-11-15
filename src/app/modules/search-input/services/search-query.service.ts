import { Injectable } from '@angular/core';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

@Injectable()
export class SearchQueryService {
  // TODO: Not implemented. Will require some sort of intermediate step for us to work with.
  // eslint-disable-next-line unused-imports/no-unused-vars
  parseTextToFilters<T>(queryText: string, properties: SearchProperty<T>[]): QueryFilters<T> {
    return [['event', '=', 'CONNECT']] as QueryFilters<unknown>;
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  formatFiltersToQuery<T>(query: QueryFilters<T>, properties: SearchProperty<T>[]): string {
    return 'Event = "CONNECT"';
  }
}
