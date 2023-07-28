import { Injectable } from '@angular/core';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { UserService } from 'app/services/user.service';

@Injectable()
export class IxUserComboboxService {
  constructor(private userService: UserService) {}

  getNewProvider(): UserComboboxProvider {
    return new UserComboboxProvider(this.userService);
  }
}
