import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { QrCodeComponent, QrCodeDirective } from 'ng-qrcode';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { ChangePasswordFormComponent } from 'app/modules/layout/topbar/change-password-dialog/change-password-form/change-password-form.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/two-factor.component';
import { FirstLoginDialogComponent } from './first-login-dialog.component';

describe('FirstLoginDialogComponent', () => {
  let spectator: Spectator<FirstLoginDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: FirstLoginDialogComponent,
    declarations: [MockComponents(ChangePasswordFormComponent, TwoFactorComponent)],
    providers: [
      mockProvider(AuthService, {
        wasOneTimePasswordChanged$: new BehaviorSubject(false),
        isOtpwUser$: of(true),
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

  it('shows the "Finish" button only when both steps are completed', async () => {
    const authService = spectator.inject(AuthService);
    jest.spyOn(authService.wasOneTimePasswordChanged$, 'next');

    let finishButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeNull();

    spectator.component.passwordChanged();

    expect(spectator.component.wasOneTimePasswordChanged()).toBe(true);
    expect(authService.wasOneTimePasswordChanged$.next).toHaveBeenCalledWith(true);

    const twoFactorComponent = spectator.query(TwoFactorComponent);
    twoFactorComponent.userTwoFactorAuthConfigured = true;
    spectator.detectChanges();

    finishButton = await loader.getHarness(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toExist();

    await finishButton.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
