import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';

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
  const clickSave = (): void => spectator.component.submit();

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
    clickSave();

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

    clickSave();

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

    clickSave();

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
    clickSave();

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
});
