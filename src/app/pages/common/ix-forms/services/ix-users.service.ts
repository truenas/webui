import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { UserService } from 'app/services';

@Injectable()
export default class IxUsersService {
  constructor(
    private userService: UserService,
    private translate: TranslateService,
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
}
