import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services/user.service';

interface UserComboboxOptions {
  valueField?: keyof Pick<User, 'username' | 'uid' | 'id'>;
  initialOptions?: Option[];
  queryType?: ComboboxQueryType;
}

export class UserComboboxProvider implements IxComboboxProvider {
  protected page = 0;
  readonly pageSize = 50;
  protected valueField: keyof Pick<User, 'username' | 'uid' | 'id'>;
  private initialOptions: Option[];
  protected queryType: ComboboxQueryType;

  constructor(
    protected userService: UserService,
    options: UserComboboxOptions = {},
  ) {
    this.valueField = options.valueField ?? 'username';
    this.initialOptions = options.initialOptions ?? [];
    this.queryType = options.queryType ?? ComboboxQueryType.Default;
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
    const queryMethod = this.queryType === ComboboxQueryType.Smb
      ? this.userService.smbUserQueryDsCache.bind(this.userService)
      : this.userService.userQueryDsCache.bind(this.userService);

    return queryMethod(filterValue, offset).pipe(
      map((users) => this.userQueryResToOptions(users)),
      map((options) => [...this.initialOptions, ...this.excludeInitialOptions(options)]),
    );
  }

  private excludeInitialOptions(options: Option[]): Option[] {
    return options.filter((option) => !this.initialOptions.some((initial) => initial.value === option.value));
  }

  private userQueryResToOptions(users: User[]): Option[] {
    return users.map((user) => ({
      label: user.username,
      value: user[this.valueField],
    }));
  }
}
