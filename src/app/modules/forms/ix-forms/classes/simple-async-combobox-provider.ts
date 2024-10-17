import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';

export class SimpleAsyncComboboxProvider implements IxComboboxProvider {
  fetch(filterValue: string): Observable<Option[]> {
    if (this.options?.length) {
      return of(this.filter(this.options, filterValue));
    }
    return this.options$
      .pipe(
        tap((options: Option[]) => this.options = options),
        map((options: Option[]) => this.filter(options, filterValue)),
      );
  }

  nextPage(): Observable<Option[]> { return of([]); }

  filter(options: Option[], search: string): Option[] {
    if (options?.length) {
      if (search) {
        return options.filter((option: Option) => {
          return option.label.toLowerCase().includes(search.toLowerCase())
            || option.value.toString().toLowerCase().includes(search.toLowerCase());
        });
      }
      return [...options];
    }
    return [];
  }

  private options: Option[];
  constructor(private options$: Observable<Option[]>) { }
}
