import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';
import { DiskFormComponent } from './disk-form.component';

describe('DiskFormComponent', () => {
  let spectator: Spectator<DiskFormComponent>;
  let loader: HarnessLoader;
  let store$: MockStore;

  const dataDisk = {
    name: 'sdc',
    serial: 'VB9fbb6dfe-9cf26570',
    advpowermgmt: DiskPowerLevel.Level127,
    description: 'Some disk description',
    hddstandby: DiskStandby.Minutes10,
    passwd: '',
    devname: 'sdc',
    identifier: '{serial}VB9fbb6dfe-9cf26570',
  } as Disk;

  const slideInRef: SlideInRef<Disk | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => dataDisk),
  };

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: DiskFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('disk.update', dataDisk),
      ]),
      mockAuth(),
      provideMockStore({
        selectors: [{
          selector: selectIsEnterprise,
          value: false,
        }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
    await spectator.fixture.whenStable();
  });

  describe('community edition', () => {
    beforeEach(() => {
      store$.overrideSelector(selectIsEnterprise, false);
      store$.refreshState();
    });

    it('does not show SED section', async () => {
      expect(await loader.getHarnessOrNull(
        TnInputHarness.with({ selector: '[formControlName="passwd"]' }),
      )).toBeNull();
      expect(await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ selector: '[formControlName="clear_pw"]' }),
      )).toBeNull();
    });

    it('sets disk settings when form is opened', async () => {
      expect(await (await getInput('name')).getValue()).toBe('sdc');
      expect(await (await getInput('serial')).getValue()).toBe('VB9fbb6dfe-9cf26570');
      expect(await (await getInput('description')).getValue()).toBe('Some disk description');
      expect(await (await getSelect('hddstandby')).getDisplayText()).toBe('10');
      expect(await (await getSelect('advpowermgmt')).getDisplayText())
        .toBe('Level 127 - Maximum power usage with Standby');
    });

    it('saves disk settings when form is saved', async () => {
      await (await getInput('description')).setValue('New disk description');
      await (await getSelect('advpowermgmt')).selectOption('Level 64 - Intermediate power usage with Standby');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
        advpowermgmt: '64',
        description: 'New disk description',
        hddstandby: '10',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: [{
          identifier: '{serial}VB9fbb6dfe-9cf26570',
          advpowermgmt: '64',
          description: 'New disk description',
          hddstandby: '10',
        }],
      });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('enterprise', () => {
    beforeEach(async () => {
      store$.overrideSelector(selectIsEnterprise, true);
      store$.refreshState();

      // recreate the component after overriding to enterprise view
      // to ensure that `ngOnInit` picks up those changes.
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();
    });

    it('disables and clears \'SED Password\' when \'Clear SED Password\' is checked', async () => {
      const sedPassword = await getInput('passwd');
      await sedPassword.setValue('sedPassword');

      // make sure the password is there
      expect(await sedPassword.getValue()).toBe('sedPassword');

      // clear it
      await (await getCheckbox('clear_pw')).check();

      // make sure it *isn't* there anymore
      expect(await sedPassword.isDisabled()).toBe(true);
      expect(await sedPassword.getValue()).toBe('');
    });

    it('sets disk settings when form is opened', async () => {
      expect(await (await getInput('name')).getValue()).toBe('sdc');
      expect(await (await getInput('serial')).getValue()).toBe('VB9fbb6dfe-9cf26570');
      expect(await (await getInput('description')).getValue()).toBe('Some disk description');
      expect(await (await getInput('passwd')).getValue()).toBe('');
      expect(await (await getCheckbox('clear_pw')).isChecked()).toBe(false);
      expect(await (await getSelect('hddstandby')).getDisplayText()).toBe('10');
      expect(await (await getSelect('advpowermgmt')).getDisplayText())
        .toBe('Level 127 - Maximum power usage with Standby');
    });

    it('saves disk settings when form is saved', async () => {
      await (await getInput('description')).setValue('New disk description');
      await (await getInput('passwd')).setValue('123456');
      await (await getSelect('advpowermgmt')).selectOption('Level 64 - Intermediate power usage with Standby');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', ['{serial}VB9fbb6dfe-9cf26570', {
        advpowermgmt: '64',
        description: 'New disk description',
        hddstandby: '10',
        passwd: '123456',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: [{
          identifier: '{serial}VB9fbb6dfe-9cf26570',
          advpowermgmt: '64',
          description: 'New disk description',
          hddstandby: '10',
          passwd: '123456',
        }],
      });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});

// disk-list opens this form through FormSidePanelService, a host that provides no SlideInRef
// and drives submission from its own footer. The legacy SlideIn host is still live (vdevs'
// disk-info-card), so both paths need coverage.
describe('DiskFormComponent - side panel host (no SlideInRef)', () => {
  let spectator: Spectator<DiskFormComponent>;
  let loader: HarnessLoader;

  const dataDisk = {
    name: 'sdc',
    serial: 'VB9fbb6dfe-9cf26570',
    advpowermgmt: DiskPowerLevel.Level127,
    description: 'Some disk description',
    hddstandby: DiskStandby.Minutes10,
    passwd: '',
    devname: 'sdc',
    identifier: '{serial}VB9fbb6dfe-9cf26570',
  } as Disk;

  const createComponent = createComponentFactory({
    component: DiskFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      { provide: SlideInRef, useValue: null },
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('disk.update', dataDisk),
      ]),
      mockAuth(),
      provideMockStore({
        selectors: [{
          selector: selectIsEnterprise,
          value: false,
        }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({ props: { diskToEdit: dataDisk } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await spectator.fixture.whenStable();
  });

  it('renders no in-form Save button, leaving it to the panel footer', async () => {
    expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Save' }))).toBeNull();
  });

  it('resolves the disk from the diskToEdit input and emits closed on save', async () => {
    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    const nameInput = await loader.getHarness(
      TnInputHarness.with({ selector: '[formControlName="name"]' }),
    );
    expect(await nameInput.getValue()).toBe('sdc');

    const descriptionInput = await loader.getHarness(
      TnInputHarness.with({ selector: '[formControlName="description"]' }),
    );
    await descriptionInput.setValue('New disk description');

    expect(spectator.component.canSubmit()).toBe(true);
    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.update', [
      '{serial}VB9fbb6dfe-9cf26570',
      expect.objectContaining({ description: 'New disk description' }),
    ]);
    expect(closedSpy).toHaveBeenCalledWith([
      expect.objectContaining({ identifier: '{serial}VB9fbb6dfe-9cf26570' }),
    ]);
  });
});
