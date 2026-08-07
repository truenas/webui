import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtentType, IscsiExtentUsefor } from 'app/enums/iscsi.enum';
import { Choices } from 'app/interfaces/choices.interface';
import { ExtentWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/extent-wizard-step/extent-wizard-step.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('ExtentWizardStepComponent', () => {
  let spectator: Spectator<ExtentWizardStepComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExtentWizardStepComponent,
    providers: [
      FormBuilder,
      mockAuth(),
      mockApi([
        mockCall('iscsi.extent.disk_choices', {
          'zvol/tank/regular-vol': 'tank/regular-vol (10 GiB)',
          'zvol/tank/another-vol': 'tank/another-vol (20 GiB)',
          'zvol/tank/myvol@snapshot1': 'tank/myvol@snapshot1 [ro]',
          'zvol/tank/myvol@snapshot2': 'tank/myvol@snapshot2 [ro]',
        } as Choices),
      ]),
      {
        provide: FilesystemService,
        useValue: {
          getFilesystemNodeProvider: jest.fn(),
        },
      },
    ],
  });

  const getDiskSelect = (): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: '[formControlName="disk"]' }),
  );
  const getRoCheckbox = (): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: '[formControlName="ro"]' }),
  );

  beforeEach(() => {
    const fb = new FormBuilder();
    const mockForm = fb.group({
      name: ['test-extent', [Validators.required]],
      type: [IscsiExtentType.Disk, [Validators.required]],
      disk: fb.control<string | null>(null, [Validators.required]),
      path: ['', [Validators.required]],
      filesize: [0, [Validators.required]],
      dataset: ['', [Validators.required]],
      volsize: fb.control<number | null>(null, [Validators.required]),
      usefor: [IscsiExtentUsefor.Vmware, [Validators.required]],
      product_id: [''],
      ro: [false],
    });

    spectator = createComponent({
      props: {
        form: mockForm,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('snapshot readonly behavior - user perspective', () => {
    it('should show readonly checkbox as enabled and unchecked by default', async () => {
      const roCheckbox = await getRoCheckbox();

      expect(await roCheckbox.isDisabled()).toBe(false);
      expect(await roCheckbox.isChecked()).toBe(false);
    });

    it('should disable and check readonly checkbox when user selects a snapshot', async () => {
      const deviceSelect = await getDiskSelect();
      const roCheckbox = await getRoCheckbox();

      // Initially enabled
      expect(await roCheckbox.isDisabled()).toBe(false);

      // User selects a snapshot
      await deviceSelect.selectOption('tank/myvol@snapshot1 [ro]');
      spectator.detectChanges();

      // Checkbox should now be disabled and checked
      expect(await roCheckbox.isDisabled()).toBe(true);
      expect(await roCheckbox.isChecked()).toBe(true);
    });

    it('should show snapshot info banner when snapshot is selected', async () => {
      const deviceSelect = await getDiskSelect();

      // Initially no banner
      let banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeFalsy();

      // User selects snapshot
      await deviceSelect.selectOption('tank/myvol@snapshot1 [ro]');
      spectator.detectChanges();

      // Banner should appear
      banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('Snapshot Selected');
      expect(banner?.textContent).toContain('Snapshots preserve data at a specific point in time');
    });

    it('should hide snapshot banner when user switches to regular device', async () => {
      const deviceSelect = await getDiskSelect();

      // Select snapshot first
      await deviceSelect.selectOption('tank/myvol@snapshot1 [ro]');
      spectator.detectChanges();

      let banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeTruthy();

      // Switch to regular device
      await deviceSelect.selectOption('tank/regular-vol (10 GiB)');
      spectator.detectChanges();

      // Banner should disappear
      banner = spectator.query('.snapshot-info-box');
      expect(banner).toBeFalsy();
    });

    it('should re-enable readonly checkbox when user switches from snapshot to regular device', async () => {
      const deviceSelect = await getDiskSelect();
      const roCheckbox = await getRoCheckbox();

      // Select snapshot
      await deviceSelect.selectOption('tank/myvol@snapshot1 [ro]');
      spectator.detectChanges();
      expect(await roCheckbox.isDisabled()).toBe(true);

      // Switch to regular device
      await deviceSelect.selectOption('tank/regular-vol (10 GiB)');
      spectator.detectChanges();

      // Checkbox should be enabled again
      expect(await roCheckbox.isDisabled()).toBe(false);
    });

    it('should allow user to manually check readonly for regular devices', async () => {
      const deviceSelect = await getDiskSelect();
      const roCheckbox = await getRoCheckbox();

      // Select regular device
      await deviceSelect.selectOption('tank/regular-vol (10 GiB)');
      spectator.detectChanges();

      // User checks readonly
      await roCheckbox.check();

      // Should be checked and still enabled
      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(false);
    });

    it('should preserve user readonly selection when switching between regular devices', async () => {
      const deviceSelect = await getDiskSelect();
      const roCheckbox = await getRoCheckbox();

      // Select first device and check readonly
      await deviceSelect.selectOption('tank/regular-vol (10 GiB)');
      await roCheckbox.check();
      spectator.detectChanges();

      expect(await roCheckbox.isChecked()).toBe(true);

      // Switch to another regular device
      await deviceSelect.selectOption('tank/another-vol (20 GiB)');
      spectator.detectChanges();

      // Readonly should still be checked (preserved)
      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(false);
    });

    it('should force readonly when switching from regular device to snapshot', async () => {
      const deviceSelect = await getDiskSelect();
      const roCheckbox = await getRoCheckbox();

      // Select regular device with readonly unchecked
      await deviceSelect.selectOption('tank/regular-vol (10 GiB)');
      await roCheckbox.uncheck();
      spectator.detectChanges();

      expect(await roCheckbox.isChecked()).toBe(false);

      // Switch to snapshot
      await deviceSelect.selectOption('tank/myvol@snapshot1 [ro]');
      spectator.detectChanges();

      // Should be forced to checked and disabled
      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);
    });

    it('should keep readonly checkbox enabled when user selects Create New zvol', async () => {
      const deviceSelect = await getDiskSelect();
      const roCheckbox = await getRoCheckbox();

      // Initially enabled
      expect(await roCheckbox.isDisabled()).toBe(false);

      // User selects "Create New"
      await deviceSelect.selectOption('Create New');
      spectator.detectChanges();

      // Checkbox should remain enabled (new zvols default to read-write)
      expect(await roCheckbox.isDisabled()).toBe(false);
      expect(await roCheckbox.isChecked()).toBe(false);
    });

    it('should keep readonly disabled when switching between different snapshots', async () => {
      const deviceSelect = await getDiskSelect();
      const roCheckbox = await getRoCheckbox();

      // User selects first snapshot
      await deviceSelect.selectOption('tank/myvol@snapshot1 [ro]');
      spectator.detectChanges();

      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);

      // User switches to different snapshot
      await deviceSelect.selectOption('tank/myvol@snapshot2 [ro]');
      spectator.detectChanges();

      // Should remain checked and disabled
      expect(await roCheckbox.isChecked()).toBe(true);
      expect(await roCheckbox.isDisabled()).toBe(true);
    });
  });
});
