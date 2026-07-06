import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnIconButtonHarness, TnInputHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { InitiatorFormComponent } from 'app/pages/sharing/iscsi/initiator/initiator-form/initiator-form.component';

describe('InitiatorFormComponent', () => {
  let spectator: SpectatorRouting<InitiatorFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  const createComponent = createRoutingFactory({
    component: InitiatorFormComponent,
    imports: [
      ReactiveFormsModule,
      DualListBoxComponent,
    ],
    providers: [
      mockAuth(),
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }),
      mockApi([
        mockCall('iscsi.global.sessions', [{
          initiator: 'inr1',
          initiator_addr: '10.0.0.1',
        }] as IscsiGlobalSession[]),
        mockCall('iscsi.initiator.query', [{ id: 1, comment: 'comment1', initiators: ['inr11', 'inr12'] }]),
        mockCall('iscsi.initiator.create'),
        mockCall('iscsi.initiator.update'),
      ]),
      mockProvider(DialogService),
    ],
  });

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows current initiator values when form is being edited', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();

    expect(spectator.queryAll('tn-list[aria-label="Connected Initiators"] tn-list-item')).toHaveLength(1);
    expect(spectator.queryAll('tn-list[aria-label="Allowed Initiators"] tn-list-item')).toHaveLength(2);

    expect(api.call).toHaveBeenCalledWith('iscsi.global.sessions');
    expect(api.call).toHaveBeenCalledWith('iscsi.initiator.query', [[['id', '=', 1]]]);

    expect(await (await getTnCheckbox('all')).isChecked()).toBe(false);
    expect(await (await getTnInput('new_initiator')).getValue()).toBe('');
    expect(await (await getTnInput('comment')).getValue()).toBe('comment1');
  });

  it('sends an update payload to websocket and closes modal when Save button is pressed', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();

    const available = spectator.queryAll('tn-list[aria-label="Connected Initiators"] tn-list-item');

    expect(available).toHaveLength(1);
    expect(spectator.queryAll('tn-list[aria-label="Allowed Initiators"] tn-list-item')).toHaveLength(2);

    spectator.click(available[0]);

    const addButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'chevron-right' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.queryAll('tn-list[aria-label="Connected Initiators"] tn-list-item')).toHaveLength(0);
    expect(spectator.queryAll('tn-list[aria-label="Allowed Initiators"] tn-list-item')).toHaveLength(3);

    await (await getTnInput('comment')).setValue('new_comment');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenLastCalledWith('iscsi.initiator.update', [1, {
      comment: 'new_comment',
      initiators: ['inr11', 'inr12', 'inr1'],
    }]);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'sharing', 'iscsi', 'initiators']);
  });

  it('sends empty initiators when allow all is secected', async () => {
    spectator.setRouteParam('pk', '1');

    await (await getTnCheckbox('all')).check();
    await (await getTnInput('comment')).setValue('new_comment');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenLastCalledWith('iscsi.initiator.update', [1, {
      comment: 'new_comment',
      initiators: [],
    }]);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'sharing', 'iscsi', 'initiators']);
  });

  it('adds a new initiator and closes modal when Save button is pressed', async () => {
    spectator.detectChanges();

    expect(spectator.queryAll('tn-list[aria-label="Connected Initiators"] tn-list-item')).toHaveLength(1);
    expect(spectator.queryAll('tn-list[aria-label="Allowed Initiators"] tn-list-item')).toHaveLength(0);

    const addNewInitiatorButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'plus' }));

    await (await getTnInput('new_initiator')).setValue('new_initiator_1');
    await addNewInitiatorButton.click();

    await (await getTnInput('new_initiator')).setValue('new_initiator_2');
    await addNewInitiatorButton.click();
    spectator.detectChanges();

    expect(spectator.queryAll('tn-list[aria-label="Connected Initiators"] tn-list-item')).toHaveLength(1);
    expect(spectator.queryAll('tn-list[aria-label="Allowed Initiators"] tn-list-item')).toHaveLength(2);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenLastCalledWith('iscsi.initiator.create', [{
      comment: '',
      initiators: ['new_initiator_1', 'new_initiator_2'],
    }]);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'sharing', 'iscsi', 'initiators']);
  });

  it('redirects to Initiator List page when Cancel button is pressed', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
    await button.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'sharing', 'iscsi', 'initiators']);
  });

  it('loads connected initiators when Refresh button is pressed', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Refresh' }));
    await button.click();

    expect(api.call).toHaveBeenLastCalledWith('iscsi.global.sessions');
  });
});
