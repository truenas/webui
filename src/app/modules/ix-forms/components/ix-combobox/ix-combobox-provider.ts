import { Observable, map } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

export interface IxComboboxProvider {
  /**
   * Filter the options based on query string. Should handle <empty string> and return normal
   * list of options in that case.
   * @param value The query string
   * @returns An observable of options that will replace the current list
   */
  fetch(filterValue: string): Observable<Option[]>;

  /**
    * Takes the filterValue (which can be empty) and fetches the next page of options
    * to be shown. Leaves it up to the user to manage pagination context like
    * (total items, items per page, number of pages etc)
    * @returns Should return a list of option to be concatenated to the current list
    */
  nextPage(filterValue: string): Observable<Option[]>;

  /**
   * Used to map the fetch result to a new array of options for any needed changes before
   * the options array is consumed by IxComboboxComponent
   */
  mapOptions?(options: Option[]): Option[];
}

export class IxComboboxProviderManager {
  constructor(private provider: IxComboboxProvider) { }
  fetch(filterValue: string): Observable<Option[]> {
    return this.provider.fetch(filterValue).pipe(
      map((result) => {
        if (this.provider.mapOptions) {
          return this.provider.mapOptions(result);
        }
        return result;
      }),
    );
  }

  nextPage(filterValue: string): Observable<Option[]> {
    return this.provider.nextPage(filterValue).pipe(
      map((result) => {
        if (this.provider.mapOptions) {
          return this.provider.mapOptions(result);
        }
        return result;
      }),
    );
  }
}
