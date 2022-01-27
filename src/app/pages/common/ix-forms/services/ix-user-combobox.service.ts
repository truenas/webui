import { Injectable } from '@angular/core';
import { UserComboboxProvider } from 'app/pages/common/ix-forms/components/classes/user-combobox-provider';
import { UserService } from 'app/services';

@Injectable()
export class IxUserComboboxService {
  constructor(private userService: UserService) {}

  getNewProvider(): UserComboboxProvider {
    return new UserComboboxProvider(this.userService);
  }
}
