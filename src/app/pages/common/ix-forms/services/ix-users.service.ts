import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { UserComboboxProvider } from 'app/pages/common/ix-forms/classes/user-combobox-provider';
import { UserService } from 'app/services';

@Injectable()
export default class IxUsersService {
  constructor(
    private userService: UserService,
  ) {}
  private userQueryResToOptions: (users: User[]) => Option[] = (users): Option[] => users.map((user) => {
    return { label: user.username, value: user.username };
  });

  loadUsers(filterValue: string = '', offset: number = 0): Observable<Option[]> {
    return this.userService.userQueryDsCache(filterValue, offset)
      .pipe(map(this.userQueryResToOptions));
  }

  searchQuery(filterValue: string, currentOffset: number): Observable<Option[]> {
    return this.loadUsers(filterValue, currentOffset);
  }

  getNewProvider(): UserComboboxProvider {
    return new UserComboboxProvider(this);
  }
}
