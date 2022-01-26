import { Subject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { IxCombobox2Provider } from 'app/pages/common/ix-forms/components/ix-combobox2/ix-combobox2-provider.interface';
import IxUsersService from 'app/pages/common/ix-forms/services/ix-users.service';

export class UserComboboxProvider implements IxCombobox2Provider {
  private userProviderUpdater$ = new Subject<void>();
  private loading = false;
  get isLoading(): boolean {
    return this.loading;
  }

  pageOffset: number;
  options: Option[];

  filter: (query: string) => void =
  (query: string) => {
    this.loading = true;
    this.updateProvider();
    this.ixUsersService.loadUsers(query).subscribe((filteredOptions) => {
      this.loading = false;
      this.pageOffset = filteredOptions.length;
      this.options = filteredOptions;
      this.updateProvider();
    });
  };

  nextPage: (filterValue: string) => void =
  (filterValue: string = '') => {
    this.loading = true;
    this.updateProvider();
    this.ixUsersService.loadUsers(filterValue, this.pageOffset).subscribe((nextPage) => {
      this.loading = false;
      this.pageOffset += nextPage.length;
      this.options.push(...nextPage);
      this.updateProvider();
    });
  };

  get providerUpdater$(): Subject<void> {
    return this.userProviderUpdater$;
  }

  private updateProvider(): void {
    this.providerUpdater$.next();
  }

  constructor(
    private ixUsersService: IxUsersService,
  ) {
    this.ixUsersService.loadUsers().pipe(delay(3000)).subscribe((options) => {
      this.pageOffset = (options).length;
      this.options = options;
      this.updateProvider();
    });
  }
}
