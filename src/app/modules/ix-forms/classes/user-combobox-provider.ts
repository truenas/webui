import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services/user.service';

export class UserComboboxProvider implements IxComboboxProvider {
  private page = 1;
  readonly pageSize = 50;

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    const offset = this.page * this.pageSize;

    return this.userService.userQueryDsCache(filterValue, offset)
      .pipe(
        map((users) => this.userQueryResToOptions(users)),
      );
  }

  userQueryResToOptions(users: User[]): Option[] {
    return users.map((user) => {
      return { label: user.username, value: user[this.optionsValueField] };
    });
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    const offset = this.page * this.pageSize;
    return this.userService.userQueryDsCache(filterValue, offset)
      .pipe(
        map((users) => this.userQueryResToOptions(users)),
      );
  }

  constructor(
    private userService: UserService,
    private optionsValueField: 'username' | 'uid' | 'id' = 'username',
  ) {}
}
