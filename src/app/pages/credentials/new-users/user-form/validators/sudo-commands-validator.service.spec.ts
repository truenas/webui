import { FormControl } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { SudoCommandsValidatorService } from 'app/pages/credentials/new-users/user-form/validators/sudo-commands-validator.service';

describe('SudoCommandsValidatorService', () => {
  let spectator: SpectatorService<SudoCommandsValidatorService>;
  const createService = createServiceFactory(SudoCommandsValidatorService);

  beforeEach(() => {
    spectator = createService();
  });

  it('returns error when any command does not start with "/"', () => {
    const control = new FormControl(['bin/ls', '/usr/bin/id']);

    const result = spectator.service.validate(control);

    expect(result).toEqual({
      customValidator: { message: "Each command must start with '/'" },
    });
  });

  it('returns null when all commands start with "/"', () => {
    const control = new FormControl(['/bin/ls', '/usr/bin/id']);

    const result = spectator.service.validate(control);

    expect(result).toBeNull();
  });
});
