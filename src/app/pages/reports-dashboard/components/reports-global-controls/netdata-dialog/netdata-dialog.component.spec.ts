import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import {
  NetdataDialogComponent,
} from 'app/pages/reports-dashboard/components/reports-global-controls/netdata-dialog/netdata-dialog.component';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { ApiService } from 'app/services/api.service';

describe('NetdataDialogComponent', () => {
  let spectator: Spectator<NetdataDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NetdataDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('reporting.netdataweb_generate_password', '12345678'),
      ]),
      mockProvider(ReportsService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads password when dialog is open', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.netdataweb_generate_password');
  });

  it('automatically attempts to open a new tab when dialog is open', () => {
    expect(spectator.inject(ReportsService).openNetdata).toHaveBeenCalledWith('12345678');
  });

  it('shows credentials for manual login', async () => {
    const username = await loader.getHarness(IxInputHarness.with({ label: 'Username' }));
    const password = await loader.getHarness(IxInputHarness.with({ label: 'Password' }));

    expect(username).toExist();
    expect(password).toExist();
    expect(await username.getValue()).toBe('root');
    expect(await password.getValue()).toBe('12345678');
  });

  it('regenerates password when user presses Generate new password', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    const generateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Generate New Password' }));
    await generateButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(2);
    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('reporting.netdataweb_generate_password');
  });
});
