import { forkJoin, Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { IxCombobox2Provider } from 'app/pages/common/ix-forms/components/ix-combobox2/ix-combobox2-provider.interface';
import IxUsersService from 'app/pages/common/ix-forms/services/ix-users.service';

export class UserComboboxProvider implements IxCombobox2Provider {
  private ProviderUpdater$ = new Subject();
  isLoading = false;
  get loading(): boolean {
    return this.isLoading;
  }

  pageOffset: number;
  options$: Observable<Option[]> = this.ixUsersService.loadUsers().pipe(
    tap((options) => {
      this.pageOffset = (options).length;
    }),
  );

  filter: (options$: Observable<Option[]>, query: string) => void =
  (options$: Observable<Option[]>, query: string) => {
    this.isLoading = true;
    this.options$ = this.ixUsersService.loadUsers(query)
      .pipe(tap((options: Option[]) => {
        this.isLoading = false;
        this.pageOffset = options.length;
      }));
    this.updateProvider();
  };
  onScrollEnd: (filterValue: string) => void =
  (filterValue: string = '') => {
    this.isLoading = true;
    this.options$ = forkJoin([
      this.options$,
      this.ixUsersService.loadUsers(filterValue, this.pageOffset)
        .pipe(
          tap((options) => {
            this.isLoading = false;
            this.pageOffset += (options).length;
          }),
        ),
    ]).pipe(map(([arr1, arr2]) => [...(arr1), ...(arr2)]));
    this.updateProvider();
  };

  get providerUpdater$(): Subject<any> {
    return this.ProviderUpdater$;
  }

  private updateProvider(): void {
    this.providerUpdater$.next();
  }

  constructor(
    private ixUsersService: IxUsersService,
  ) {}
}
