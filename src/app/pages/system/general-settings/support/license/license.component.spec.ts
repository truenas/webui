import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import {
  DialogWithSecondaryCheckboxResult,
} from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { LicenseComponent } from './license.component';

describe('LicenseComponent', () => {
  let spectator: Spectator<LicenseComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: LicenseComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('truenas.license.upload'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of()),
      }),
      mockAuth(),
      mockWindow({
        location: {
          reload: jest.fn(),
        },
      }),
      ...ixFormTestingProviders(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('sends a create payload to websocket and closes the panel when submitted', async () => {
    const licenseInput = await loader.getHarness(TnInputHarness);
    await licenseInput.setValue('test-license');

    const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('truenas.license.upload', ['test-license']);
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('shows a confirmation dialog and reloads the page when the user confirms', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of({} as DialogWithSecondaryCheckboxResult));

    const licenseInput = await loader.getHarness(TnInputHarness);
    await licenseInput.setValue('test-license');

    spectator.component.submit();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: helptext.updateLicense.reloadDialogTitle,
      message: helptext.updateLicense.reloadDialogMessage,
    }));
    expect(spectator.inject<Window>(WINDOW).location.reload).toHaveBeenCalled();
  });
});
