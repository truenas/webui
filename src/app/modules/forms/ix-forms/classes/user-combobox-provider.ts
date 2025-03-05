import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services/user.service';

interface UserComboboxOptions {
  valueField?: 'username' | 'uid' | 'id';
  queryType?: 'default' | 'smb';
}

export class UserComboboxProvider implements IxComboboxProvider {
  protected page = 1;
  readonly pageSize = 50;
  protected options: UserComboboxOptions;

  constructor(
    protected userService: UserService,
    options: UserComboboxOptions = {},
  ) {
    this.options = {
      valueField: options.valueField ?? 'username',
      queryType: options.queryType ?? 'default',
    };
  }

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    return this.queryUsers(filterValue);
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    return this.queryUsers(filterValue);
  }

  private queryUsers(filterValue: string): Observable<Option[]> {
    const offset = this.page * this.pageSize;
    const queryMethod = this.options.queryType === 'smb'
      ? this.userService.smbUserQueryDsCache
      : this.userService.userQueryDsCache;

    return queryMethod.call(this.userService, filterValue, offset).pipe(
      map((users) => this.userQueryResToOptions(users)),
    );
  }

  private userQueryResToOptions(users: User[]): Option[] {
    return users.map((user) => ({
      label: user.username,
      value: user[this.options.valueField],
    }));
  }
}
