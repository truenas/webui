import { FormControl, FormGroup } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { GiB, TiB } from 'app/constants/bytes.constant';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Statfs } from 'app/interfaces/filesystem-stat.interface';
import { FreeSpaceValidatorService } from 'app/pages/vm/utils/free-space-validator.service';

describe('FreeSpaceValidatorService', () => {
  let spectator: SpectatorService<FreeSpaceValidatorService>;
  const createService = createServiceFactory({
    service: FreeSpaceValidatorService,
    providers: [
      mockApi([
        mockCall('filesystem.statfs', {
          free_bytes: 10 * TiB,
        } as Statfs),
      ]),
    ],
  });

  beforeEach(() => spectator = createService());

  it('quotes a maximum that is actually available, rounding the free space down', async () => {
    // Free space a hair under 50 GiB renders as `50 GiB` when rounded to the nearest
    // hundredth of a unit — a size this very validator then rejects.
    const api = spectator.inject(MockApiService);
    jest.spyOn(api, 'call').mockReturnValue(of({ free_bytes: 50 * GiB - 1 } as Statfs));

    const formGroup = new FormGroup({
      datastore: new FormControl('tighto'),
      volsize: new FormControl(50 * GiB),
    });

    await firstValueFrom(spectator.service.validate(formGroup));

    expect(formGroup.controls.volsize.errors).toEqual({
      invalidFreeSpace: {
        message: 'Not enough free space. Maximum available: 49.99 GiB',
      },
    });
  });

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
    // tn-form-field only shows errors for touched controls; the validator must
    // mark volsize touched so its programmatically-set error is visible.
    expect(formGroup.controls.volsize.touched).toBe(true);
  });
});
