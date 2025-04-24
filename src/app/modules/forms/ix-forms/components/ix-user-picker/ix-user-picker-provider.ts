import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { ignoreTranslation } from 'app/helpers/translate.helper';
import { Option } from 'app/interfaces/option.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { ApiService } from 'app/modules/websocket/api.service';

interface UserPickerOptions {
  valueField?: keyof Pick<User, 'username' | 'uid' | 'id'>;
  queryType?: ComboboxQueryType;
  queryParams?: QueryParams<User>;
}

export class UserPickerProvider implements IxComboboxProvider {
  protected valueField: keyof Pick<User, 'username' | 'uid' | 'id'>;
  protected queryParams: QueryParams<User>;
  protected queryType: ComboboxQueryType;
  protected api = inject(ApiService);
  protected page = 1;
  readonly pageSize = 50;

  constructor(
    options?: UserPickerOptions,
  ) {
    this.valueField = options.valueField ?? 'username';
    this.queryType = options.queryType ?? ComboboxQueryType.Default;
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
    const queryArgs: QueryParams<User> = [...this.queryParams];
    queryArgs[1].offset = this.page * this.pageSize;
    queryArgs[1].limit = this.pageSize;

    search = search?.trim();
    if (this.queryType === ComboboxQueryType.Smb) {
      queryArgs[0] = [['smb', '=', true], ...queryArgs[0]];
    }

    if (search?.length > 0) {
      queryArgs[0] = [['username', '~', search], ...queryArgs[0]];
    }

    return this.api.call('user.query', queryArgs).pipe(
      map((users) => this.userQueryResToOptions(users)),
    );
  }

  private userQueryResToOptions(users: User[]): Option[] {
    return users.map((user) => ({
      label: ignoreTranslation(user.username),
      value: user[this.valueField],
    }));
  }
}
