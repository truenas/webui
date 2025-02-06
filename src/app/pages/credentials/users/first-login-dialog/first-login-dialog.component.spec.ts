import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { QrCodeComponent, QrCodeDirective } from 'ng-qrcode';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';
import { FirstLoginDialogComponent } from './first-login-dialog.component';

describe('FirstLoginDialogComponent', () => {
  let spectator: Spectator<FirstLoginDialogComponent>;
  let loader: HarnessLoader;

  const mockTwoFactorConfig$ = new BehaviorSubject({ secret_configured: false });
  const mockWasOneTimePasswordChanged$ = new BehaviorSubject(false);
  const mockIsOtpwUser$ = new BehaviorSubject(true);

  const createComponent = createComponentFactory({
    component: FirstLoginDialogComponent,
    declarations: [MockComponents(ChangePasswordFormComponent, TwoFactorComponent)],
    providers: [
      mockProvider(AuthService, {
        wasOneTimePasswordChanged$: mockWasOneTimePasswordChanged$,
        isOtpwUser$: mockIsOtpwUser$.asObservable(),
        userTwoFactorConfig$: mockTwoFactorConfig$.asObservable(),
      }),
      provideMockStore(),
      mockProvider(MatDialogRef),
    ],
    imports: [
      NgxSkeletonLoaderModule,
      QrCodeComponent,
      QrCodeDirective,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders the required sub-components', () => {
    expect(spectator.query(ChangePasswordFormComponent)).toExist();
    expect(spectator.query(TwoFactorComponent)).toExist();
  });

  it('shows the "Finish" button only when both steps are completed for OTPW user', async () => {
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
    mockWasOneTimePasswordChanged$.next(true);

    mockTwoFactorConfig$.next({ secret_configured: false });
    spectator.detectChanges();

    const finishButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeNull();
  });

  it('does not show the "Finish" button when 2FA is not configured for non-OTPW user', async () => {
    mockIsOtpwUser$.next(false);

    mockTwoFactorConfig$.next({ secret_configured: false });
    spectator.detectChanges();

    const finishButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeNull();
  });

  it('calls passwordChanged when password is updated', () => {
    const authService = spectator.inject(AuthService);
    const passwordChangedSpy = jest.spyOn(authService.wasOneTimePasswordChanged$, 'next');

    spectator.component.passwordChanged();

    expect(passwordChangedSpy).toHaveBeenCalledWith(true);
  });
});
