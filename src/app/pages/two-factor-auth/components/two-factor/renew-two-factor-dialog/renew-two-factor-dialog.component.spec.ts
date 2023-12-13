import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { RenewTwoFactorDialogComponent } from 'app/pages/two-factor-auth/components/two-factor/renew-two-factor-dialog/renew-two-factor-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

describe('RenewTwoFactorDialog', () => {
  let spectator: Spectator<RenewTwoFactorDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: RenewTwoFactorDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockWebsocket([
        mockCall('user.renew_2fa_secret'),
      ]),
      mockProvider(MatDialogRef, {
        close: jest.fn(),
      }),
      mockProvider(ErrorHandlerService),

    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('submits the form when submit button is clicked and returns true', async () => {
    spectator.component.form.patchValue({
      interval: 5,
      otp_digits: 5,
    });

    const renewBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Renew' }));
    await renewBtn.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'user.renew_2fa_secret',
      ['root', { interval: 5, otp_digits: 5 }],
    );
    expect(spectator.inject(AuthService).refreshUser).toHaveBeenCalled();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('when the form errors, returns false', async () => {
    spectator.component.form.patchValue({
      interval: 5,
      otp_digits: 5,
    });

    const websocket = spectator.inject(WebSocketService);
    jest.spyOn(websocket, 'call').mockImplementation(() => {
      return throwError(() => new Error('Error something'));
    });

    const renewBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Renew' }));
    await renewBtn.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
  });
});
