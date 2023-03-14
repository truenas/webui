import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ComboboxOption } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox-provider';

export class SimpleAsyncComboboxProvider implements IxComboboxProvider {
  fetch(filterValue: string): Observable<ComboboxOption[]> {
    if (this.options && this.options.length) {
      return of(this.filter(this.options, filterValue));
    }
    return this.options$
      .pipe(
        tap((options: ComboboxOption[]) => this.options = options),
        map((options: ComboboxOption[]) => this.filter(options, filterValue)),
      );
  }

  nextPage(): Observable<ComboboxOption[]> { return of([]); }

  filter(options: ComboboxOption[], search: string): ComboboxOption[] {
    if (options && options.length) {
      if (search) {
        return options.filter((option: ComboboxOption) => {
          return option.label.toLowerCase().includes(search.toLowerCase())
              || option.value.toString().toLowerCase().includes(search.toLowerCase());
        });
      }
      return [...options];
    }
    return [];
  }

  private options: ComboboxOption[];
  constructor(private options$: Observable<ComboboxOption[]>) { }
}
