import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { KiB } from 'app/constants/bytes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiExtentRpm, IscsiExtentType } from 'app/enums/iscsi.enum';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ExtentFormComponent', () => {
  let spectator: Spectator<ExtentFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

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
      mockProvider(SlideInService),
      mockProvider(StorageService),
      mockProvider(DialogService),
      mockWebSocket([
        mockCall('iscsi.extent.create'),
        mockCall('iscsi.extent.update'),
        mockCall('iscsi.extent.disk_choices', {
          key_device_1: 'value_device_1',
          key_device_2: 'value_device_2',
          key_device_3: 'value_device_3',
        } as Choices),
      ]),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('iscsi.extent.create', [{
        avail_threshold: null,
        blocksize: 1024,
        comment: 'new_comment',
        disk: 'key_device_2',
        enabled: false,
        insecure_tpc: false,
        name: 'new_name',
        path: 'key_device_2',
        pblocksize: true,
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
          { provide: SLIDE_IN_DATA, useValue: existingExtent },
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('iscsi.extent.update', [
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
          ro: true,
          rpm: '5400',
          serial: 'serial_number',
          type: IscsiExtentType.File,
          xen: true,
        },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
