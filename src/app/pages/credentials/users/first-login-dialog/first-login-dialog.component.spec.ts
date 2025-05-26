import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { QrCodeComponent, QrCodeDirective } from 'ng-qrcode';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { BehaviorSubject, map } from 'rxjs';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';
import { FirstLoginDialog } from './first-login-dialog.component';

describe('FirstLoginDialogComponent', () => {
  let spectator: Spectator<FirstLoginDialog>;
  let loader: HarnessLoader;

  const mockTwoFactorConfig$ = new BehaviorSubject({ secret_configured: false });
  const mockWasOneTimePasswordChanged$ = new BehaviorSubject(false);
  const mockIsOtpwUser$ = new BehaviorSubject(true);
  const isStigEnabled$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: FirstLoginDialog,
    declarations: [MockComponents(ChangePasswordFormComponent, TwoFactorComponent)],
    providers: [
      mockProvider(AuthService, {
        wasOneTimePasswordChanged$: mockWasOneTimePasswordChanged$,
        isOtpwUser$: mockIsOtpwUser$.asObservable(),
        userTwoFactorConfig$: mockTwoFactorConfig$.asObservable(),
      }),
      provideMockStore(),
      mockProvider(MatDialogRef),
      mockProvider(ApiService, {
        call: jest.fn(() => isStigEnabled$.pipe(
          map((stigEnabled) => ({ enable_gpos_stig: stigEnabled } as SystemSecurityConfig)),
        )),
      }),
    ],
    imports: [
      NgxSkeletonLoaderModule,
      QrCodeComponent,
      QrCodeDirective,
    ],
  });

  function setupComponent(stigEnabled = false): void {
    isStigEnabled$.next(stigEnabled);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('renders the required sub-components', () => {
    setupComponent();
    expect(spectator.query(ChangePasswordFormComponent)).toExist();
    expect(spectator.query(TwoFactorComponent)).toExist();
  });

  it('renders the correct required sub-components', () => {
    setupComponent(true);
    expect(spectator.query(ChangePasswordFormComponent)).not.toExist();
    expect(spectator.query(TwoFactorComponent)).toExist();
  });

  it('shows the "Finish" button only when both steps are completed for OTPW user', async () => {
    setupComponent();
    let finishButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeNull();

    mockWasOneTimePasswordChanged$.next(true);

    mockTwoFactorConfig$.next({ secret_configured: true });
    spectator.detectChanges();

    finishButton = await loader.getHarness(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toExist();

    await finishButton.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('shows the "Finish" button only when 2FA is configured for non-OTPW user', async () => {
    setupComponent();
    mockIsOtpwUser$.next(false);

    mockTwoFactorConfig$.next({ secret_configured: true });
    spectator.detectChanges();

    expect(spectator.query(ChangePasswordFormComponent)).not.toExist();

    const finishButton = await loader.getHarness(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toExist();

    await finishButton.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('does not show the "Finish" button when steps are incomplete for OTPW user', async () => {
    setupComponent();
    mockWasOneTimePasswordChanged$.next(true);

    mockTwoFactorConfig$.next({ secret_configured: false });
    spectator.detectChanges();

    const finishButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeNull();
  });

  it('does not show the "Finish" button when 2FA is not configured for non-OTPW user', async () => {
    setupComponent();
    mockIsOtpwUser$.next(false);

    mockTwoFactorConfig$.next({ secret_configured: false });
    spectator.detectChanges();

    const finishButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeNull();
  });

  it('calls passwordChanged when password is updated', () => {
    setupComponent();
    const authService = spectator.inject(AuthService);
    const passwordChangedSpy = jest.spyOn(authService.wasOneTimePasswordChanged$, 'next');

    spectator.component.passwordChanged();

    expect(passwordChangedSpy).toHaveBeenCalledWith(true);
  });
});
