import { Injectable } from '@angular/core';
import { concat, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { IxCombobox2Provider } from 'app/pages/common/ix-forms/components/ix-combobox2/ix-combobox2-provider.interface';
import IxUsersService from 'app/pages/common/ix-forms/services/ix-users.service';

@Injectable()
export class IxUserComboboxProvider implements IxCombobox2Provider {
  pageOffset = 0;
  options$: Observable<Option[]> = this.ixUsersService.loadUsers().pipe(
    tap((options) => {
      this.pageOffset = options.length;
    }),
  );
  filter: (options$: Observable<Option[]>, query: string) => void =
  (options$: Observable<Option[]>, query: string) => {
    this.options$ = this.ixUsersService.loadUsers(query)
      .pipe(tap((options: Option[]) => {
        this.pageOffset = options.length;
      }));
  };
  onScrollEnd: (filterValue: string) => void =
  (filterValue: string = '') => {
    this.options$ = concat(this.options$, this.ixUsersService.loadUsers(filterValue, this.pageOffset)
      .pipe(
        tap((options) => {
          this.pageOffset = this.pageOffset + options.length;
        }),
      ));
  };

  constructor(private ixUsersService: IxUsersService) {}
}
