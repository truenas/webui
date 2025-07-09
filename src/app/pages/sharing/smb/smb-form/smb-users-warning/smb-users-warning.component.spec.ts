import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';
import { SmbUsersWarningComponent } from './smb-users-warning.component';

describe('SmbUsersWarningComponent', () => {
  let spectator: Spectator<SmbUsersWarningComponent>;
  let component: SmbUsersWarningComponent;

  const createComponent = createComponentFactory({
    component: SmbUsersWarningComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('sharing.smb.share_precheck'),
      ]),
      mockProvider(Router),
      mockProvider(SmbValidationService, {
        checkForSmbUsersWarning: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef, {
        close: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
  });

  it('shows SMB users warning when there are no SMB users', () => {
    const smbValidationService = spectator.inject(SmbValidationService);
    jest.spyOn(smbValidationService, 'checkForSmbUsersWarning').mockReturnValue(of(true));

    component.ngOnInit();
    spectator.detectChanges();

    const warning = spectator.query('.smb-users-warning');
    expect(warning).toBeTruthy();

    expect(warning.textContent).toContain('Looks like you don\'t have any users who\'ll be able to access this share.');
    expect(warning.textContent).toContain('Create a new user');
    expect(warning.textContent).toContain('Configure Directory Services');
    expect(warning.textContent).toContain('Ignore the error and add users later.');
  });

  it('does not show warning when there are SMB users', () => {
    const smbValidationService = spectator.inject(SmbValidationService);
    jest.spyOn(smbValidationService, 'checkForSmbUsersWarning').mockReturnValue(of(false));

    component.ngOnInit();
    spectator.detectChanges();

    const warning = spectator.query('.smb-users-warning');
    expect(warning).toBeFalsy();
  });

  it('should close form and navigate when navigation links are clicked', () => {
    const smbValidationService = spectator.inject(SmbValidationService);
    jest.spyOn(smbValidationService, 'checkForSmbUsersWarning').mockReturnValue(of(true));

    component.ngOnInit();
    spectator.detectChanges();

    const router = spectator.inject(Router);
    const slideInRef = spectator.inject(SlideInRef);
    jest.spyOn(router, 'navigate');
    jest.spyOn(slideInRef, 'close');

    const options = spectator.queryAll('ul li');

    options[0].querySelector('a')?.click();
    expect(slideInRef.close).toHaveBeenCalledWith({ response: false });
    expect(router.navigate).toHaveBeenCalledWith(['/credentials', 'users']);

    options[1].querySelector('a')?.click();
    expect(slideInRef.close).toHaveBeenCalledWith({ response: false });
    expect(router.navigate).toHaveBeenCalledWith(['/credentials', 'directory-services']);
  });

  it('should hide warning when ignore option is clicked', () => {
    const smbValidationService = spectator.inject(SmbValidationService);
    jest.spyOn(smbValidationService, 'checkForSmbUsersWarning').mockReturnValue(of(true));

    component.ngOnInit();
    spectator.detectChanges();

    let warning = spectator.query('.smb-users-warning');
    expect(warning).toBeTruthy();

    const ignoreOption = spectator.queryAll('ul li')[2].querySelector('span');
    ignoreOption?.click();
    spectator.detectChanges();

    warning = spectator.query('.smb-users-warning');
    expect(warning).toBeFalsy();
  });
});
