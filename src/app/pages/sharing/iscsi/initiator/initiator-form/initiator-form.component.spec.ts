import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnIconButtonHarness, TnInputHarness,
} from '@truenas/ui-components';
import { firstValueFrom, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { InitiatorFormComponent } from 'app/pages/sharing/iscsi/initiator/initiator-form/initiator-form.component';

describe('InitiatorFormComponent', () => {
  let spectator: SpectatorRouting<InitiatorFormComponent>;
  let loader: HarnessLoader;
  let api: TypedApiService;
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
      mockTypedApi([
        mockTypedQuery('iscsi.global.sessions', [{
          initiator: 'inr1',
          initiator_addr: '10.0.0.1',
        }] as WebUiQueryEntity<'iscsi.global.sessions'>[]),
        mockTypedQuery('iscsi.initiator.query', [{ id: 1, comment: 'comment1', initiators: ['inr11', 'inr12'] }]),
        mockTypedCall('iscsi.initiator.create', null),
        mockTypedCall('iscsi.initiator.update', null),
      ]),
      mockProvider(DialogService),
      mockProvider(UnsavedChangesService, {
        showConfirmDialog: jest.fn(() => of(true)),
      }),
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
    api = spectator.inject(TypedApiService);
  });

  it('shows current initiator values when form is being edited', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(spectator.queryAll('tn-list[aria-label="Connected Initiators"] tn-list-item')).toHaveLength(1);
    expect(spectator.queryAll('tn-list[aria-label="Allowed Initiators"] tn-list-item')).toHaveLength(2);

    expect(api.query).toHaveBeenCalledWith('iscsi.global.sessions');
    expect(api.query).toHaveBeenCalledWith('iscsi.initiator.query', [['id', '=', 1]]);

    expect(await (await getTnCheckbox('all')).isChecked()).toBe(false);
    expect(await (await getTnInput('new_initiator')).getValue()).toBe('');
    expect(await (await getTnInput('comment')).getValue()).toBe('comment1');
  });

  it('sends an update payload to websocket and closes modal when Save button is pressed', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
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

  it('does not save on implicit form submission, since Save lives outside the form', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    // What pressing Enter in a text field does: with "Allow All" on there is one text field left
    // and no submit button, which is exactly the shape the HTML spec submits implicitly.
    await (await getTnCheckbox('all')).check();
    spectator.query('form')!.dispatchEvent(new Event('submit'));

    expect(api.call).not.toHaveBeenCalledWith('iscsi.initiator.update', expect.anything());
  });

  it('leaves the page without a prompt when nothing was changed', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(true);
    expect(spectator.inject(UnsavedChangesService).showConfirmDialog).not.toHaveBeenCalled();
  });

  it('asks to confirm leaving the page when the description was changed', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await (await getTnInput('comment')).setValue('new_comment');

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(true);
    expect(spectator.inject(UnsavedChangesService).showConfirmDialog).toHaveBeenCalled();
  });

  it('asks to confirm leaving the page when the allowed initiators were changed', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await (await getTnInput('new_initiator')).setValue('new_initiator_1');
    await (await loader.getHarness(TnIconButtonHarness.with({ name: 'plus' }))).click();

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(true);
    expect(spectator.inject(UnsavedChangesService).showConfirmDialog).toHaveBeenCalled();
  });

  it('does not ask about text left sitting in the Add IQN field', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await (await getTnInput('new_initiator')).setValue('not_added_yet');

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(true);
    expect(spectator.inject(UnsavedChangesService).showConfirmDialog).not.toHaveBeenCalled();
  });

  it('stays on the page when the unsaved changes prompt is declined', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    jest.spyOn(spectator.inject(UnsavedChangesService), 'showConfirmDialog').mockReturnValue(of(false));

    await (await getTnInput('comment')).setValue('new_comment');

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(false);
  });

  it('stops asking to confirm once the changes are saved', async () => {
    spectator.setRouteParam('pk', '1');
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    await (await getTnInput('comment')).setValue('new_comment');
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Save' }))).click();

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(true);
    expect(spectator.inject(UnsavedChangesService).showConfirmDialog).not.toHaveBeenCalled();
  });

  it('loads connected initiators when Refresh button is pressed', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Refresh' }));
    await button.click();

    expect(api.query).toHaveBeenLastCalledWith('iscsi.global.sessions');
  });
});
