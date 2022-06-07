import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SedUser } from 'app/enums/sed-user.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SedFormComponent } from 'app/pages/system/advanced/sed-form/sed-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('SedFormComponent', () => {
  let spectator: Spectator<SedFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: SedFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('system.advanced.update'),
      ]),
      mockProvider(IxSlideInService),
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    spectator.component.setupForm(
      { sed_user: SedUser.User } as AdvancedConfig,
      '123',
    );
  });

  it('shows current system advanced sed values when form is being edited', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'ATA Security User': SedUser.User,
      'SED Password': '123',
      'Confirm SED Password': '',
    });
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'ATA Security User': SedUser.Master,
      'SED Password': 'pleasechange',
      'Confirm SED Password': 'pleasechange',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.advanced.update', [
      {
        sed_user: SedUser.Master,
        sed_passwd: 'pleasechange',
      },
    ]);
  });
});
