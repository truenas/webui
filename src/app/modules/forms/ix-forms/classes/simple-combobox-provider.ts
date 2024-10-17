import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';

export class SimpleComboboxProvider implements IxComboboxProvider {
  fetch(filterValue: string): Observable<Option[]> {
    if (filterValue) {
      return of(this.options.filter((option: Option) => {
        return option.label.toLowerCase().includes(filterValue.toLowerCase())
          || option.value.toString().toLowerCase().includes(filterValue.toLowerCase());
      }));
    }
    return of([...this.options]);
  }

  nextPage(): Observable<Option[]> { return of([]); }

  constructor(private options: Option[]) {}
}
