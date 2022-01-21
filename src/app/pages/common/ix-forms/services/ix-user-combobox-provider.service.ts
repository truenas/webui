import { Injectable } from '@angular/core';
import IxUsersService from 'app/pages/common/ix-forms/services/ix-users.service';
import { UserComboboxProvider } from '../classes/user-combobox-provider';

@Injectable()
export class IxUserComboboxProviderService {
  getNewProvider(): UserComboboxProvider {
    return new UserComboboxProvider(this.ixUsersService);
  }

  constructor(
    private ixUsersService: IxUsersService,
  ) {}
}
