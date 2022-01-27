import { Injectable } from '@angular/core';
import { IxUserComboboxProvider } from 'app/pages/common/ix-forms/components/classes/ix-user-combobox.provider';
import { UserService } from 'app/services';

@Injectable()
export class IxUserComboboxService {
  constructor(private userService: UserService) {}

  getNewProvider(): IxUserComboboxProvider {
    return new IxUserComboboxProvider(this.userService);
  }
}
