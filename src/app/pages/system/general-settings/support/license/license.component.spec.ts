import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import {
  DialogWithSecondaryCheckboxResult,
} from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { LicenseComponent } from './license.component';

describe('LicenseComponent', () => {
  let spectator: Spectator<LicenseComponent>;
  let loader: HarnessLoader;
  let api: TypedApiService;

  const createComponent = createComponentFactory({
    component: LicenseComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockTypedApi([
        mockTypedCall('truenas.license.upload', null),
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
    api = spectator.inject(TypedApiService);
  });

  it('sends a create payload to websocket and closes the panel when submitted', async () => {
    const licenseInput = await loader.getHarness(TnInputHarness);
    await licenseInput.setValue('test-license');

    const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('truenas.license.upload', ['test-license']);
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('shows a confirmation dialog and reloads the page when the user confirms', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of({} as DialogWithSecondaryCheckboxResult));

    const licenseInput = await loader.getHarness(TnInputHarness);
    await licenseInput.setValue('test-license');

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: helptext.updateLicense.reloadDialogTitle,
      message: helptext.updateLicense.reloadDialogMessage,
    }));
    expect(spectator.inject<Window>(WINDOW).location.reload).toHaveBeenCalled();
  });
});
