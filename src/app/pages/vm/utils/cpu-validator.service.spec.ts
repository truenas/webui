import { FormControl, FormGroup } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('CpuValidatorService', () => {
  let spectator: SpectatorService<CpuValidatorService>;
  const createService = createServiceFactory({
    service: CpuValidatorService,
    providers: [
      mockApi([
        mockCall('vm.maximum_supported_vcpus', 7),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('createValidator', () => {
    it('loads maximum supported vcpus and creates a validator that returns an error '
      + 'when product of vcpus, cores and threads is greater than the limit', async () => {
      const validator = spectator.service.createValidator();
      const form = new FormGroup({
        vcpus: new FormControl(2),
        cores: new FormControl(2),
        threads: new FormControl(2),
      });

      const result$ = validator(form.controls.vcpus);
      expect(await lastValueFrom(result$)).toEqual({
        invalidCpus: {
          message: 'The product of vCPUs, cores and threads must not exceed 7 on this system.',
        },
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.maximum_supported_vcpus');
    });

    it('only loads maximum supported vcpus once', () => {
      spectator.service.createValidator();
      spectator.service.createValidator();
      spectator.service.createValidator();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('returns a validator that does not return an error when product of '
      + 'vcpus, cores and threads is less than or equal to the allowed limit', async () => {
      const validator = spectator.service.createValidator();
      const form = new FormGroup({
        vcpus: new FormControl(1),
        cores: new FormControl(2),
        threads: new FormControl(2),
      });

      const result$ = validator(form.controls.vcpus);
      expect(await lastValueFrom(result$)).toBeNull();
    });
  });
});
