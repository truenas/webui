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
import { TwoFactorSetupDialog } from './two-factor-setup-dialog.component';

describe('FirstLoginDialogComponent', () => {
  let spectator: Spectator<TwoFactorSetupDialog>;
  let loader: HarnessLoader;

  const mockTwoFactorConfig$ = new BehaviorSubject({ secret_configured: false });

  const createComponent = createComponentFactory({
    component: TwoFactorSetupDialog,
    declarations: [MockComponents(ChangePasswordFormComponent, TwoFactorComponent)],
    providers: [
      mockProvider(AuthService, {
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
    expect(spectator.query(TwoFactorComponent)).toExist();
  });

  it('shows the "Finish" button only when 2fa is configured', async () => {
    let finishButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toBeNull();

    mockTwoFactorConfig$.next({ secret_configured: true });
    spectator.detectChanges();

    finishButton = await loader.getHarness(MatButtonHarness.with({ text: 'Finish' }));
    expect(finishButton).toExist();

    await finishButton.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('closes dialog on first click of Finish button', async () => {
    mockTwoFactorConfig$.next({ secret_configured: true });
    spectator.detectChanges();

    const finishButton = await loader.getHarness(MatButtonHarness.with({ text: 'Finish' }));
    const dialogRef = spectator.inject(MatDialogRef);

    expect(finishButton).toExist();

    await finishButton.click();

    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });
});
