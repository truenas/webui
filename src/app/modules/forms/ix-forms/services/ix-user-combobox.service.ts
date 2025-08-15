import { Injectable, inject } from '@angular/core';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { UserService } from 'app/services/user.service';

@Injectable()
export class IxUserComboboxService {
  private userService = inject(UserService);


  getNewProvider(): UserComboboxProvider {
    return new UserComboboxProvider(this.userService);
  }
}
