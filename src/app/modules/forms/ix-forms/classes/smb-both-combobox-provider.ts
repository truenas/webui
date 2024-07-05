import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services/user.service';

export class SmbBothComboboxProvider implements IxComboboxProvider {
  protected page = 1;
  readonly pageSize = 50;

  excludeInitialOptions(options: Option[]): Option[] {
    return options.filter((option) => {
      return !this.initialOptions.find((initialOption) => initialOption.value === option.value);
    });
  }

  queryResToOptions(users: User[], groups: Group[]): Option[] {
    const userOptions = users
      .filter((user) => user.id_type_both)
      .map((user) => ({ label: user.username, value: user[this.userOptionsValueField] }));
    const groupOptions = groups
      .filter((user) => user.id_type_both)
      .map((group) => ({ label: group.group, value: group[this.groupOptionsValueField] }));

    return [...userOptions, ...groupOptions];
  }

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    const offset = this.page * this.pageSize;

    return forkJoin([
      this.userService.smbUserQueryDsCache(filterValue, offset),
      this.userService.smbGroupQueryDsCache(filterValue, false, offset),
    ]).pipe(
      map(([users, groups]) => this.queryResToOptions(users, groups)),
      map((options) => [...this.initialOptions, ...this.excludeInitialOptions(options)]),
    );
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    const offset = this.page * this.pageSize;
    return forkJoin([
      this.userService.smbUserQueryDsCache(filterValue, offset),
      this.userService.smbGroupQueryDsCache(filterValue, false, offset),
    ]).pipe(
      map(([users, groups]) => this.queryResToOptions(users, groups)),
      map((options) => this.excludeInitialOptions(options)),
    );
  }

  constructor(
    protected userService: UserService,
    private userOptionsValueField: 'username' | 'uid' | 'id' = 'username',
    private groupOptionsValueField: 'group' | 'gid' | 'id' = 'group',
    protected initialOptions: Option[] = [],
  ) {}
}
