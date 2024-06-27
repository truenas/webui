import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { UserService } from 'app/services/user.service';

export class SmbUserComboboxProvider extends UserComboboxProvider {
  override fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    const offset = this.page * this.pageSize;

    return this.userService.smbUserQueryDsCache(filterValue, offset)
      .pipe(
        map((users) => this.userQueryResToOptions(users)),
      );
  }

  override nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    const offset = this.page * this.pageSize;
    return this.userService.smbUserQueryDsCache(filterValue, offset)
      .pipe(
        map((users) => this.userQueryResToOptions(users)),
      );
  }

  constructor(
    userService: UserService,
    optionsValueField: 'username' | 'uid' | 'id' = 'username',
  ) {
    super(userService, optionsValueField);
  }
}
