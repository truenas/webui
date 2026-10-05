import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ValidationErrors } from '@angular/forms';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Observable, of, throwError } from 'rxjs';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';
import { ApiCallError } from 'app/services/errors/error.classes';

describe('SmbValidationService', () => {
  let spectator: SpectatorService<SmbValidationService>;
  const createService = createServiceFactory({
    service: SmbValidationService,
    providers: [mockProvider(ApiService)],
  });

  beforeEach(() => {
    spectator = createService();
  });

  function refuseWith(reason: string): void {
    jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
      throwError(() => new ApiCallError({ data: { reason } } as JsonRpcError)),
    );
  }

  /** Runs the validator against a name typed into a control, past its debounce. */
  function validate(name: string): ValidationErrors | null | undefined {
    const control = new FormControl('');
    let result: ValidationErrors | null | undefined;
    (spectator.service.validate()(control) as Observable<ValidationErrors | null>)
      .subscribe((errors) => { result = errors; });
    control.setValue(name);
    tick(300);
    return result;
  }

  it('accepts a name the appliance has nothing to say about', fakeAsync(() => {
    jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of(null));

    expect(validate('share')).toBeNull();
  }));

  it('says a name is taken', fakeAsync(() => {
    refuseWith('[EEXIST] sharing.smb.share_precheck.name: Share with this name already exists.');

    expect(validate('taken')).toEqual({
      customValidator: { message: 'Share with this name already exists' },
    });
  }));

  it('names the invalid characters, however middleware capitalises the sentence', fakeAsync(() => {
    refuseWith(
      '[EINVAL] smb_share_precheck.name: Value error, bad/name: share name contains the following invalid characters: /',
    );

    expect(validate('bad/name')).toEqual({
      customValidator: { message: 'Share name contains the following invalid characters: /' },
    });
  }));

  it('passes on a refusal it does not recognise as middleware worded it', fakeAsync(() => {
    refuseWith('[EINVAL] sharing.smb.share_precheck.name: Something else entirely');

    expect(validate('odd')).toEqual({
      customValidator: { message: '[EINVAL] sharing.smb.share_precheck.name: Something else entirely' },
    });
  }));
});
