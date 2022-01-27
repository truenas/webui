import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxProvider } from 'app/pages/common/ix-forms/components/ix-combobox2/ix-combobox-provider';
import { UserService } from 'app/services';

export class IxUserComboboxProvider implements IxComboboxProvider {
  private page = 1;
  readonly pageSize = 50;

  filter(options: Option[], filterValue: string): Observable<Option[]> {
    this.page = 0;
    const offset = this.page * this.pageSize;

    return this.userService.userQueryDsCache(filterValue, offset)
      .pipe(
        map(this.userQueryResToOptions),
      );
  }

  userQueryResToOptions: (users: User[]) => Option[] = (users): Option[] => users.map((user) => {
    return { label: user.username, value: user.username };
  });

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    const offset = this.page * this.pageSize;
    return this.userService.userQueryDsCache(filterValue, offset)
      .pipe(
        map(this.userQueryResToOptions),
      );
  }

  constructor(private userService: UserService) {}
}
