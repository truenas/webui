import { Subject } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxCombobox2Provider } from 'app/pages/common/ix-forms/components/ix-combobox2/ix-combobox2-provider.interface';

export class SimpleComboboxProvider implements IxCombobox2Provider {
  private simpleOptions: Option[];
  private originalOptions: Option[];

  get options(): Option[] {
    return this.simpleOptions;
  }

  set options(initialOptions: Option[]) {
    this.originalOptions = [...initialOptions];
    this.simpleOptions = [...this.originalOptions];
  }

  readonly isLoading: boolean = false;
  readonly providerUpdater$: Subject<void> = new Subject<void>();

  filter(value: string): void {
    if (value) {
      this.simpleOptions = this.originalOptions.filter((option: Option) => {
        return option.label.toLowerCase().includes(value.toLowerCase())
            || option.value.toString().toLowerCase().includes(value.toLowerCase());
      });
    } else {
      this.simpleOptions = this.originalOptions;
    }
    this.providerUpdater$.next();
  }

  nextPage(): void { }

  constructor(options: Option[]) {
    this.options = options;
    this.providerUpdater$.next();
  }
}
