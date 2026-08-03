import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnFormFieldHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of, Subject, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { StorageService } from 'app/services/storage.service';

const mockNamingSchema = ['%Y %H %d %M %m'];

describe('SnapshotAddFormComponent', () => {
  let spectator: Spectator<SnapshotAddFormComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;

  const createComponent = createComponentFactory({
    component: SnapshotAddFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('pool.snapshot.create'),
        mockCall('pool.filesystem_choices', ['APPS', 'POOL']),
        mockCall('replication.list_naming_schemas', mockNamingSchema),
        mockCall('vmware.dataset_has_vms', true),
      ]),
      ...ixFormTestingProviders(),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  // The `<tn-side-panel>` host owns the Save button and drives submission through `submit()`.
  const save = (): void => spectator.component.submit();

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(MockApiService);
  });

  it('presets name with current date and time', async () => {
    const defaultName = await (await getInput('name')).getValue();

    // Use regex to avoid flaky test when minute boundary is crossed during test execution
    expect(defaultName).toMatch(/^manual-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/);
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    await (await getSelect('dataset')).selectOption('APPS');
    await (await getInput('name')).setValue('test-snapshot-name');

    expect(api.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', false]);

    await (await getCheckbox('vmware_sync')).check();

    expect(spectator.component.canSubmit()).toBe(true);

    const closed = jest.fn();
    spectator.component.closed.subscribe(closed);
    save();

    expect(api.call).toHaveBeenCalledWith('pool.snapshot.create', [
      {
        dataset: 'APPS',
        name: 'test-snapshot-name',
        recursive: false,
        vmware_sync: true,
      },
    ]);
    expect(closed).toHaveBeenCalledWith(true);
  });

  it('checks when form is submitted with naming schema', async () => {
    await (await getSelect('dataset')).selectOption('APPS');
    spectator.component.form.controls.name.setValue('');
    await (await getCheckbox('recursive')).check();
    await (await getSelect('naming_schema')).selectOption('%Y %H %d %M %m');

    expect(api.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', true]);

    save();

    expect(api.call).toHaveBeenCalledWith('pool.snapshot.create', [
      {
        dataset: 'APPS',
        naming_schema: '%Y %H %d %M %m',
        recursive: true,
        vmware_sync: false,
      },
    ]);
  });

  it('should raise error when name and naming schema has values', async () => {
    await (await getSelect('dataset')).selectOption('APPS');
    await (await getInput('name')).setValue('snapshot-name');
    await (await getSelect('naming_schema')).selectOption('%Y %H %d %M %m');

    save();

    expect(spectator.component.canSubmit()).toBe(false);
    expect(api.call).not.toHaveBeenCalledWith('pool.snapshot.create', expect.anything());
  });

  it('blocks saving while the VM check is in flight', async () => {
    // The check re-runs on every dataset/recursive change, so it must gate Save only — routing it
    // through the panel's busy state would dim and lock the whole form mid-edit.
    const pendingVmCheck$ = new Subject<boolean>();
    const call = api.call as jest.Mock;
    const respondNormally = call.getMockImplementation()!;
    call.mockImplementation((method: string, params: unknown) => (
      method === 'vmware.dataset_has_vms' ? pendingVmCheck$ : respondNormally(method, params)
    ));

    await (await getSelect('dataset')).selectOption('APPS');
    await (await getInput('name')).setValue('test-snapshot-name');

    expect(spectator.component.canSubmit()).toBe(false);

    pendingVmCheck$.next(false);
    spectator.detectChanges();

    expect(spectator.component.canSubmit()).toBe(true);
  });

  it('ignores a superseded VM check, so a slow earlier response cannot unblock Save or go stale', async () => {
    const firstCheck$ = new Subject<boolean>();
    const secondCheck$ = new Subject<boolean>();
    const checks = [firstCheck$, secondCheck$];
    const call = api.call as jest.Mock;
    const respondNormally = call.getMockImplementation()!;
    call.mockImplementation((method: string, params: unknown) => (
      method === 'vmware.dataset_has_vms' ? (checks.shift() ?? of(false)) : respondNormally(method, params)
    ));

    await (await getSelect('dataset')).selectOption('APPS');
    await (await getCheckbox('recursive')).check();

    // The first lookup answers late, after its change was superseded.
    firstCheck$.next(true);
    spectator.detectChanges();

    expect(spectator.component.canSubmit()).toBe(false);

    secondCheck$.next(false);
    spectator.detectChanges();

    expect(spectator.component.canSubmit()).toBe(true);
    await (await getInput('name')).setValue('test-snapshot-name');
    save();

    // `vmware_sync` is only sent when the newest lookup found VMs — the stale `true` must not leak.
    expect(api.call).toHaveBeenCalledWith('pool.snapshot.create', [
      expect.not.objectContaining({ vmware_sync: expect.anything() }),
    ]);
  });

  it('re-checks for VMs in dataset when recursive checkbox is toggled or dataset changed', async () => {
    jest.clearAllMocks();

    await (await getSelect('dataset')).selectOption('POOL');
    await (await getCheckbox('recursive')).check();
    await (await getSelect('dataset')).selectOption('APPS');
    await (await getCheckbox('recursive')).uncheck();

    expect(api.call).toHaveBeenNthCalledWith(1, 'vmware.dataset_has_vms', ['POOL', false]);
    expect(api.call).toHaveBeenNthCalledWith(2, 'vmware.dataset_has_vms', ['POOL', true]);
    expect(api.call).toHaveBeenNthCalledWith(3, 'vmware.dataset_has_vms', ['APPS', true]);
    expect(api.call).toHaveBeenNthCalledWith(4, 'vmware.dataset_has_vms', ['APPS', false]);
  });

  it('skips the VM lookup while no dataset is picked, and keeps Save usable', async () => {
    jest.clearAllMocks();

    // Toggling Recursive first would otherwise ask `vmware.dataset_has_vms` about '' and raise an
    // error modal at a user who has not chosen anything yet.
    await (await getCheckbox('recursive')).check();

    expect(api.call).not.toHaveBeenCalledWith('vmware.dataset_has_vms', expect.anything());
    expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();

    // The skipped lookup must still clear the Save gate it opened.
    await (await getSelect('dataset')).selectOption('APPS');
    await (await getInput('name')).setValue('test-snapshot-name');

    expect(spectator.component.canSubmit()).toBe(true);
  });

  describe('VM check failures', () => {
    /** Makes every `vmware.dataset_has_vms` lookup fail, leaving the other calls untouched. */
    const failVmChecks = (): void => {
      const call = api.call as jest.Mock;
      const respondNormally = call.getMockImplementation()!;
      call.mockImplementation((method: string, params: unknown) => (
        method === 'vmware.dataset_has_vms'
          ? throwError(() => new Error('vmware is down'))
          : respondNormally(method, params)
      ));
    };

    it('blocks Save when the lookup fails, rather than silently taking an unsynced snapshot', async () => {
      failVmChecks();

      await (await getSelect('dataset')).selectOption('APPS');
      await (await getInput('name')).setValue('test-snapshot-name');

      // Unanswered means `vmware_sync` cannot be decided — the save must not go through as `false`.
      expect(spectator.component.canSubmit()).toBe(false);

      save();

      expect(api.call).not.toHaveBeenCalledWith('pool.snapshot.create', expect.anything());
    });

    it('explains the block on the dataset field', async () => {
      failVmChecks();

      await (await getSelect('dataset')).selectOption('APPS');

      const datasetField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Dataset' }));

      expect(await datasetField.getErrorMessage()).toBe(
        'Could not check this dataset for VMs. A snapshot of a dataset holding VMs needs VMWare Sync,'
        + ' so saving is blocked until the check succeeds.',
      );
    });

    it('keeps Save blocked even if the field error is cleared from elsewhere', async () => {
      failVmChecks();

      await (await getSelect('dataset')).selectOption('APPS');
      await (await getInput('name')).setValue('test-snapshot-name');

      // The control error only explains the block; Save is gated on the signal, so a stray
      // `setErrors`/`updateValueAndValidity` elsewhere can't quietly let an unsynced snapshot out.
      spectator.component.form.controls.dataset.setErrors(null);
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(false);
    });

    it('lets auto re-checks fail quietly into the field, and only reports an explicit retry', async () => {
      failVmChecks();

      await (await getSelect('dataset')).selectOption('APPS');
      await (await getCheckbox('recursive')).check();
      await (await getCheckbox('recursive')).uncheck();

      // The lookup re-runs on every dataset/recursive change, so with the endpoint down a modal per
      // attempt would pile up on a form that already explains the failure inline and offers a retry.
      expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();

      // A retry is the user asking for this lookup specifically, so its failure gets the backend's
      // own wording rather than dropping the click on the floor.
      await (await loader.getHarness(TnButtonHarness.with({ label: 'Retry VM Check' }))).click();

      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledTimes(1);
    });

    it('retries the lookup on demand, and clears the block once it succeeds', async () => {
      failVmChecks();

      await (await getSelect('dataset')).selectOption('APPS');
      await (await getInput('name')).setValue('test-snapshot-name');

      const retry = await loader.getHarness(TnButtonHarness.with({ label: 'Retry VM Check' }));
      (api.call as jest.Mock).mockImplementation(() => of(true));
      await retry.click();

      expect(api.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', false]);
      expect(spectator.component.canSubmit()).toBe(true);

      // The answer arrived, so the VMWare Sync checkbox is back and its value reaches the payload.
      await (await getCheckbox('vmware_sync')).check();
      save();

      expect(api.call).toHaveBeenCalledWith('pool.snapshot.create', [
        expect.objectContaining({ vmware_sync: true }),
      ]);
    });

    it('keeps the retry button in place through the check it starts, and reports the outcome', async () => {
      failVmChecks();
      await (await getSelect('dataset')).selectOption('APPS');

      const pendingCheck$ = new Subject<boolean>();
      (api.call as jest.Mock).mockImplementation(() => pendingCheck$);

      const retry = await loader.getHarness(TnButtonHarness.with({ label: 'Retry VM Check' }));
      await retry.click();

      // Unmounting the button on the state change it triggers would drop the pressing user's focus
      // to `<body>`; it stays put and goes disabled instead, and the live region says why.
      expect(await retry.isDisabled()).toBe(true);
      expect(spectator.query('[role="status"]')).toHaveText('Checking this dataset for VMs…');

      pendingCheck$.next(true);
      pendingCheck$.complete();
      spectator.detectChanges();

      expect(await retry.isDisabled()).toBe(false);
      expect(spectator.query('[role="status"]')).toHaveText(
        'This dataset was checked for VMs. Saving is no longer blocked.',
      );
    });

    it('does not submit the form when clicked with the gate already clear', async () => {
      failVmChecks();

      await (await getSelect('dataset')).selectOption('APPS');
      await (await getInput('name')).setValue('test-snapshot-name');

      const retry = await loader.getHarness(TnButtonHarness.with({ label: 'Retry VM Check' }));
      (api.call as jest.Mock).mockImplementation(() => of(true));
      await retry.click();

      // The button outlives the failure that put it there, so by now it is live inside the
      // `<ix-form>`'s `<form>` with Save enabled — it must not act as a submit button.
      expect(spectator.component.canSubmit()).toBe(true);

      await retry.click();

      expect(api.call).not.toHaveBeenCalledWith('pool.snapshot.create', expect.anything());
    });

    it('takes the retry button away once another dataset is picked', async () => {
      failVmChecks();

      await (await getSelect('dataset')).selectOption('APPS');

      expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Retry VM Check' }))).not.toBeNull();

      // A new dataset is a new question, and focus is on the select rather than the button, so
      // leaving a "Retry VM Check" (and a live region saying saving is blocked) behind would just
      // describe a state the form is no longer in.
      (api.call as jest.Mock).mockImplementation(() => of(true));
      await (await getSelect('dataset')).selectOption('POOL');

      expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Retry VM Check' }))).toBeNull();
      expect(spectator.query('[role="status"]')).toHaveText('');
    });
  });
});

// Its own TestBed: the suite above instantiates the module in `beforeEach`, so a per-test provider
// override there is rejected.
describe('SnapshotAddFormComponent option loading failures', () => {
  const createComponent = createComponentFactory({
    component: SnapshotAddFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('replication.list_naming_schemas', mockNamingSchema),
        mockCall('vmware.dataset_has_vms', true),
      ]),
      mockProvider(StorageService, {
        getDatasetNameOptions: jest.fn(() => throwError(() => new Error('choices are down'))),
      }),
      ...ixFormTestingProviders(),
    ],
  });

  it('surfaces a failed options load instead of routing it through form validation', () => {
    const spectator = createComponent();

    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    // Would have landed on the form's controls otherwise — but a failed option lookup can't map
    // onto any of them.
    expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).not.toHaveBeenCalled();
  });
});
