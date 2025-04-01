import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { ApiService } from 'app/modules/websocket/api.service';

interface UserPickerOptions {
  valueField?: keyof Pick<User, 'username' | 'uid' | 'id'>;
  queryParams?: QueryParams<User>;
}

export class UserPickerProvider implements IxComboboxProvider {
  protected page = 1;
  readonly pageSize = 50;
  protected valueField: keyof Pick<User, 'username' | 'uid' | 'id'>;
  protected queryParams?: QueryParams<User>;
  protected api = inject(ApiService);

  constructor(
    options: UserPickerOptions = {},
  ) {
    this.valueField = options.valueField ?? 'username';
    this.queryParams = options.queryParams ?? [];
  }

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    return this.queryUsers(filterValue);
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    return this.queryUsers(filterValue);
  }

  private queryUsers(search: string): Observable<Option[]> {
    const offset = this.page * this.pageSize;
    const queryArgs: QueryParams<User> = [...this.queryParams];

    search = search?.trim();
    if (search?.length > 0) {
      queryArgs[0] = [['username', '~', search], ...queryArgs[0]];
      queryArgs[1].offset = offset;
    }

    return this.api.call('user.query', queryArgs).pipe(
      map((users) => this.userQueryResToOptions(users)),
    );
  }

  private userQueryResToOptions(users: User[]): Option[] {
    return users.map((user) => ({
      label: user.username,
      value: user[this.valueField],
    }));
  }
}
