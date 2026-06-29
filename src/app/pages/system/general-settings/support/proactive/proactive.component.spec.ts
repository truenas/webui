import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SupportConfig } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';

describe('ProactiveComponent', () => {
  let spectator: Spectator<ProactiveComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: ProactiveComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('support.update'),
        mockCall('support.config', {
          enabled: true,
          name: 'Zepp Karlsen',
          title: 'Cannot connect',
          email: 'test-user@test-user.com',
          phone: '+888888888',
          secondary_name: 'Zepp Karlsen',
          secondary_title: 'Cannot connect',
          secondary_email: 'test-user@test-user.com',
          secondary_phone: '+999999999',
        } as SupportConfig),
        mockCall('support.is_available', true),
        mockCall('support.is_available_and_enabled', true),
      ]),
      mockProvider(SlideInRef, slideInRef),
      ...ixFormTestingProviders(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads current proactive settings and shows them in the form', async () => {
    expect(api.call).toHaveBeenCalledWith('support.config');

    expect(await (await getInput('name')).getValue()).toBe('Zepp Karlsen');
    expect(await (await getInput('title')).getValue()).toBe('Cannot connect');
    expect(await (await getInput('email')).getValue()).toBe('test-user@test-user.com');
    expect(await (await getInput('phone')).getValue()).toBe('+888888888');
    expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
    expect(await (await getInput('secondary_name')).getValue()).toBe('Zepp Karlsen');
    expect(await (await getInput('secondary_title')).getValue()).toBe('Cannot connect');
    expect(await (await getInput('secondary_email')).getValue()).toBe('test-user@test-user.com');
    expect(await (await getInput('secondary_phone')).getValue()).toBe('+999999999');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBeFalsy();
  });

  it('saves support config when form is submitted', async () => {
    await (await getInput('name')).setValue('Jhon Smith');
    await (await getInput('phone')).setValue('+777-77-77-77');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('support.update', [{
      enabled: true,
      name: 'Jhon Smith',
      title: 'Cannot connect',
      email: 'test-user@test-user.com',
      phone: '+777-77-77-77',
      secondary_name: 'Zepp Karlsen',
      secondary_title: 'Cannot connect',
      secondary_email: 'test-user@test-user.com',
      secondary_phone: '+999999999',
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('disables form when support is not available', async () => {
    spectator.inject(MockApiService).mockCall('support.is_available', false);
    spectator.component.ngOnInit();
    spectator.detectChanges();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

    expect(await saveButton.isDisabled()).toBeTruthy();
  });
});
