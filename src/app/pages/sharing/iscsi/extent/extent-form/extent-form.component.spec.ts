import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { KiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtentRpm, IscsiExtentType } from 'app/enums/iscsi.enum';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import { StorageService } from 'app/services/storage.service';

describe('ExtentFormComponent', () => {
  let spectator: Spectator<ExtentFormComponent>;
  let loader: HarnessLoader;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const existingExtent = {
    id: 123,
    name: 'test_name',
    comment: 'test_comment',
    enabled: false,
    type: IscsiExtentType.File,
    disk: 'key_device_2',
    path: '/mnt/opt',
    filesize: 512 * KiB,
    serial: 'serial_number',
    product_id: 'test_product',
    blocksize: 1024,
    pblocksize: true,
    avail_threshold: 50,
    insecure_tpc: false,
    xen: true,
    rpm: IscsiExtentRpm.Rpm5400,
    ro: true,
  } as IscsiExtent;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getIxInput = (label: string): Promise<IxInputHarness> => loader.getHarness(
    IxInputHarness.with({ label }),
  );

  const createComponent = createComponentFactory({
    component: ExtentFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        openSlideIns: jest.fn(() => 1),
      }),
      mockProvider(StorageService),
      mockProvider(DialogService),
      mockApi([
        mockCall('iscsi.extent.create'),
        mockCall('iscsi.extent.update'),
        mockCall('iscsi.extent.disk_choices', {
          key_device_1: 'value_device_1',
          key_device_2: 'value_device_2',
          key_device_3: 'value_device_3',
        } as Choices),
      ]),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  describe('adds new extent', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing extent when form is opened for add', async () => {
      expect(await (await getTnInput('name')).getValue()).toBe('');
      expect(await (await getTnInput('comment')).getValue()).toBe('');
      expect(await (await getTnCheckbox('enabled')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('insecure_tpc')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('xen')).isChecked()).toBe(false);
      expect(await (await getTnCheckbox('ro')).isChecked()).toBe(false);
      expect(await (await getTnCheckbox('pblocksize')).isChecked()).toBe(false);
      expect(await (await getTnSelect('type')).getDisplayText()).toBe('Device');
      expect(await (await getTnSelect('rpm')).getDisplayText()).toBe('SSD');
      expect(await (await getTnSelect('blocksize')).getDisplayText()).toBe('512');
      expect(await (await getTnInput('product_id')).getValue()).toBe('');
    });

    it('add new extent when form is submitted', async () => {
      await (await getTnInput('name')).setValue('new_name');
      await (await getTnInput('comment')).setValue('new_comment');
      await (await getTnCheckbox('enabled')).uncheck();
      await (await getTnCheckbox('insecure_tpc')).uncheck();
      await (await getTnCheckbox('xen')).check();
      await (await getTnCheckbox('pblocksize')).check();
      await (await getTnSelect('type')).selectOption('Device');
      await (await getTnSelect('disk')).selectOption('value_device_2');
      await (await getTnSelect('rpm')).selectOption('5400');
      await (await getTnSelect('blocksize')).selectOption('1024');
      await (await getTnCheckbox('ro')).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('iscsi.extent.create', [{
        avail_threshold: null,
        blocksize: 1024,
        comment: 'new_comment',
        disk: 'key_device_2',
        enabled: false,
        insecure_tpc: false,
        name: 'new_name',
        path: 'key_device_2',
        pblocksize: true,
        product_id: null,
        ro: true,
        rpm: '5400',
        serial: '',
        type: IscsiExtentType.Disk,
        xen: true,
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edits extent', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          extentData: existingExtent,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing extent when form is opened for edit', async () => {
      expect(await (await getTnInput('name')).getValue()).toBe('test_name');
      expect(await (await getTnInput('comment')).getValue()).toBe('test_comment');
      expect(await (await getTnCheckbox('enabled')).isChecked()).toBe(false);
      expect(await (await getTnCheckbox('insecure_tpc')).isChecked()).toBe(false);
      expect(await (await getTnCheckbox('xen')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('ro')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('pblocksize')).isChecked()).toBe(true);
      expect(await (await getTnSelect('type')).getDisplayText()).toBe('File');
      expect(await (await getTnSelect('rpm')).getDisplayText()).toBe('5400');
      expect(await (await getTnSelect('blocksize')).getDisplayText()).toBe('1024');
      expect(await (await getTnInput('serial')).getValue()).toBe('serial_number');
      expect(await (await getTnInput('product_id')).getValue()).toBe('test_product');
      expect(await (await getIxInput('Filesize')).getValue()).toBe('512 KiB');
    });

    it('edits existing extent when form opened for edit is submitted', async () => {
      await (await getTnInput('name')).setValue('test_name');
      await (await getTnInput('comment')).setValue('test_comment');
      await (await getIxInput('Filesize')).setValue('2049 KiB');
      await (await getTnSelect('blocksize')).selectOption('512');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.extent.update', [
        123,
        {
          avail_threshold: 50,
          blocksize: 512,
          comment: 'test_comment',
          enabled: false,
          filesize: 2049 * KiB + (512 - 2049 * KiB % 512),
          insecure_tpc: false,
          name: 'test_name',
          path: '/mnt/opt',
          pblocksize: true,
          product_id: 'test_product',
          ro: true,
          rpm: '5400',
          serial: 'serial_number',
          type: IscsiExtentType.File,
          xen: true,
        },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('sends product_id as null when field is empty', async () => {
      await (await getTnInput('name')).setValue('test_name');
      await (await getTnInput('comment')).setValue('test_comment');
      await (await getIxInput('Filesize')).setValue('2049 KiB');
      await (await getTnSelect('blocksize')).selectOption('512');
      spectator.component.form.controls.product_id.setValue('');
      spectator.detectChanges();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.extent.update', [
        123,
        expect.objectContaining({
          product_id: null,
        }),
      ]);
    });
  });

  describe('snapshot readonly behavior - user perspective', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should show readonly checkbox as enabled and unchecked by default', async () => {
      const roCheckbox = await getTnCheckbox('ro');

      expect(await roCheckbox.isDisabled()).toBe(false);
      expect(await roCheckbox.isChecked()).toBe(false);
    });

    it('should disable and check readonly checkbox when snapshot device is selected', async () => {
      const roCheckbox = await getTnCheckbox('ro');

      // Simulate user selecting Device extent type
      await (await getTnSelect('type')).selectOption('Device');

      // Simulate backend returning snapshot device and user selecting it
      // Note: We can't use harness here because extent-form doesn't have snapshots in mock
      // This simulates the backend returning a snapshot in the device list
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      // Verify readonly is checked and disabled (user can see this)
      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);
    });

    it('should show snapshot info banner when snapshot is selected', async () => {
      // Initially no banner visible
      let banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeFalsy();

      // User selects Device type and snapshot
      await (await getTnSelect('type')).selectOption('Device');
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      // User should now see banner
      banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('Snapshot Selected');
      expect(banner?.textContent).toContain('Snapshots preserve data at a specific point in time');
    });

    it('should hide snapshot banner when switching to regular device', async () => {
      // Start with snapshot selected
      await (await getTnSelect('type')).selectOption('Device');
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      let banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeTruthy();

      // User switches to regular device
      spectator.component.form.controls.disk.setValue('zvol/tank/regular-vol');
      spectator.detectChanges();

      // Banner should disappear from view
      banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeFalsy();
    });

    it('should re-enable readonly checkbox when switching from snapshot to regular device', async () => {
      const roCheckbox = await getTnCheckbox('ro');

      // Start with snapshot
      await (await getTnSelect('type')).selectOption('Device');
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      expect(await roCheckbox.isDisabled()).toBe(true);

      // User switches to regular device
      spectator.component.form.controls.disk.setValue('zvol/tank/regular-vol');
      spectator.detectChanges();

      // User can now interact with checkbox again
      expect(await roCheckbox.isDisabled()).toBe(false);
    });

    it('should allow user to manually check readonly for regular devices', async () => {
      const roCheckbox = await getTnCheckbox('ro');

      await (await getTnSelect('type')).selectOption('Device');
      spectator.component.form.controls.disk.setValue('zvol/tank/regular-vol');
      spectator.detectChanges();

      // User checks readonly
      await roCheckbox.check();

      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(false);
    });

    it('should preserve user readonly selection when switching between regular devices', async () => {
      const roCheckbox = await getTnCheckbox('ro');

      // User selects first device and checks readonly
      await (await getTnSelect('type')).selectOption('Device');
      spectator.component.form.controls.disk.setValue('zvol/tank/vol1');
      await roCheckbox.check();
      spectator.detectChanges();

      expect(await roCheckbox.isChecked()).toBe(true);

      // User switches to another regular device
      spectator.component.form.controls.disk.setValue('zvol/tank/vol2');
      spectator.detectChanges();

      // Readonly choice is preserved
      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(false);
    });

    it('should force readonly when switching from regular device to snapshot', async () => {
      const roCheckbox = await getTnCheckbox('ro');

      // User selects regular device and unchecks readonly
      await (await getTnSelect('type')).selectOption('Device');
      spectator.component.form.controls.disk.setValue('zvol/tank/regular-vol');
      await roCheckbox.uncheck();
      spectator.detectChanges();

      expect(await roCheckbox.isChecked()).toBe(false);

      // User switches to snapshot
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      // User sees readonly is now forced checked and disabled
      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);
    });

    it('should keep readonly disabled when switching between different snapshots', async () => {
      const roCheckbox = await getTnCheckbox('ro');

      // User selects first snapshot
      await (await getTnSelect('type')).selectOption('Device');
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);

      // User switches to different snapshot
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot2');
      spectator.detectChanges();

      // Should remain checked and disabled
      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);
    });

    it('should include disabled ro field in form submission via getRawValue', async () => {
      // Select snapshot (ro becomes disabled)
      await (await getTnSelect('type')).selectOption('Device');
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      const roControl = spectator.component.form.controls.ro;
      expect(roControl.disabled).toBe(true);
      expect(roControl.value).toBe(true);

      // getRawValue should include disabled fields for submission
      const rawValue = spectator.component.form.getRawValue();
      expect(rawValue.ro).toBe(true);
    });
  });
});
