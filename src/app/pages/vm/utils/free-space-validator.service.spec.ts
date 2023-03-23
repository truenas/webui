import { FormControl, FormGroup } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Statfs } from 'app/interfaces/filesystem-stat.interface';
import { FreeSpaceValidatorService } from 'app/pages/vm/utils/free-space-validator.service';

describe('FreeSpaceValidatorService', () => {
  let spectator: SpectatorService<FreeSpaceValidatorService>;
  const createService = createServiceFactory({
    service: FreeSpaceValidatorService,
    providers: [
      mockWebsocket([
        mockCall('filesystem.statfs', {
          free_bytes: 10 * TiB,
        } as Statfs),
      ]),
    ],
  });

  beforeEach(() => spectator = createService());

  it('returns a validator that takes a form group and checks if volsize in a datastore path fits free space', async () => {
    const formGroup = new FormGroup({
      datastore: new FormControl('poolio'),
      volsize: new FormControl(5 * TiB),
    });

    const passesValidation = await firstValueFrom(spectator.service.validate(formGroup));
    expect(passesValidation).toBeNull();
    expect(formGroup.controls.volsize.errors).toBeNull();

    formGroup.controls.volsize.setValue(15 * TiB);

    const failsValidation = await firstValueFrom(spectator.service.validate(formGroup));
    expect(failsValidation).toBeNull();
    expect(formGroup.controls.volsize.errors).toEqual({
      invalidFreeSpace: {
        message: 'Not enough free space. Maximum available: 10 TiB',
      },
    });
  });
});
