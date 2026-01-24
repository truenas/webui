import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { KiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtentRpm, IscsiExtentType } from 'app/enums/iscsi.enum';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import { StorageService } from 'app/services/storage.service';

describe('ExtentFormComponent', () => {
  let spectator: Spectator<ExtentFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

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

  const createComponent = createComponentFactory({
    component: ExtentFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn),
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
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing extent when form is opened for add', async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        Description: '',
        Device: '',
        'Disable Physical Block Size Reporting': false,
        'Enable TPC': true,
        Enabled: true,
        'Extent Type': 'Device',
        'LUN RPM': 'SSD',
        'Logical Block Size': '512',
        Name: '',
        'Product ID': '',
        'Read-only': false,
        'Xen initiator compat mode': false,
      });
    });

    it('add new extent when form is submitted', async () => {
      await form.fillForm({
        Description: 'new_comment',
        Device: 'value_device_2',
        'Disable Physical Block Size Reporting': true,
        'Enable TPC': false,
        Enabled: false,
        'Extent Type': 'Device',
        'LUN RPM': '5400',
        'Logical Block Size': '1024',
        Name: 'new_name',
        'Read-only': true,
        'Xen initiator compat mode': true,
      });

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
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingExtent }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing extent when form is opened for edit', async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        Description: 'test_comment',
        'Disable Physical Block Size Reporting': true,
        'Enable TPC': false,
        Enabled: false,
        'Extent Type': 'File',
        Filesize: '512 KiB',
        'LUN RPM': '5400',
        'Logical Block Size': '1024',
        Name: 'test_name',
        'Path to the Extent': '/mnt/opt',
        'Product ID': 'test_product',
        'Read-only': true,
        Serial: 'serial_number',
        'Xen initiator compat mode': true,
      });
    });

    it('edits existing extent when form opened for edit is submitted', async () => {
      await form.fillForm({
        Name: 'test_name',
        Description: 'test_comment',
        Filesize: '2049 KiB',
        'Logical Block Size': '512',
      });

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
      await form.fillForm({
        Name: 'test_name',
        Description: 'test_comment',
        Filesize: '2049 KiB',
        'Logical Block Size': '512',
        'Product ID': '',
      });

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
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('should show readonly checkbox as enabled and unchecked by default', async () => {
      const roCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Read-only' }));

      expect(await roCheckbox.isDisabled()).toBe(false);
      expect(await roCheckbox.getValue()).toBe(false);
    });

    it('should disable and check readonly checkbox when snapshot device is selected', async () => {
      const roCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Read-only' }));

      // Simulate user selecting Device extent type
      await form.fillForm({
        'Extent Type': 'Device',
      });

      // Simulate backend returning snapshot device and user selecting it
      // Note: We can't use harness here because extent-form doesn't have snapshots in mock
      // This simulates the backend returning a snapshot in the device list
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      // Verify readonly is checked and disabled (user can see this)
      expect(await roCheckbox.getValue()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);
    });

    it('should show snapshot info banner when snapshot is selected', async () => {
      // Initially no banner visible
      let banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeFalsy();

      // User selects Device type and snapshot
      await form.fillForm({
        'Extent Type': 'Device',
      });
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
      await form.fillForm({
        'Extent Type': 'Device',
      });
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
      const roCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Read-only' }));

      // Start with snapshot
      await form.fillForm({
        'Extent Type': 'Device',
      });
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
      const roCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Read-only' }));

      await form.fillForm({
        'Extent Type': 'Device',
      });
      spectator.component.form.controls.disk.setValue('zvol/tank/regular-vol');
      spectator.detectChanges();

      // User checks readonly
      await form.fillForm({
        'Read-only': true,
      });

      expect(await roCheckbox.getValue()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(false);
    });

    it('should preserve user readonly selection when switching between regular devices', async () => {
      const roCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Read-only' }));

      // User selects first device and checks readonly
      await form.fillForm({
        'Extent Type': 'Device',
      });
      spectator.component.form.controls.disk.setValue('zvol/tank/vol1');
      await form.fillForm({
        'Read-only': true,
      });
      spectator.detectChanges();

      expect(await roCheckbox.getValue()).toBe(true);

      // User switches to another regular device
      spectator.component.form.controls.disk.setValue('zvol/tank/vol2');
      spectator.detectChanges();

      // Readonly choice is preserved
      expect(await roCheckbox.getValue()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(false);
    });

    it('should force readonly when switching from regular device to snapshot', async () => {
      const roCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Read-only' }));

      // User selects regular device and unchecks readonly
      await form.fillForm({
        'Extent Type': 'Device',
      });
      spectator.component.form.controls.disk.setValue('zvol/tank/regular-vol');
      await form.fillForm({
        'Read-only': false,
      });
      spectator.detectChanges();

      expect(await roCheckbox.getValue()).toBe(false);

      // User switches to snapshot
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      // User sees readonly is now forced checked and disabled
      expect(await roCheckbox.getValue()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);
    });

    it('should keep readonly disabled when switching between different snapshots', async () => {
      const roCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Read-only' }));

      // User selects first snapshot
      await form.fillForm({
        'Extent Type': 'Device',
      });
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot1');
      spectator.detectChanges();

      expect(await roCheckbox.getValue()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);

      // User switches to different snapshot
      spectator.component.form.controls.disk.setValue('zvol/tank/myvol@snapshot2');
      spectator.detectChanges();

      // Should remain checked and disabled
      expect(await roCheckbox.getValue()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);
    });

    it('should include disabled ro field in form submission via getRawValue', async () => {
      // Select snapshot (ro becomes disabled)
      await form.fillForm({
        'Extent Type': 'Device',
      });
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
