import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  createComponentFactory,
  mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import {
  mockCall,
  mockApi,
} from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationRemote, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationImage } from 'app/interfaces/virtualization.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { SelectImageDialogComponent } from 'app/pages/instances/components/instance-wizard/select-image-dialog/select-image-dialog.component';

const imageChoices: Record<string, VirtualizationImage> = {
  'almalinux/8/cloud': {
    label: 'Almalinux 8 (arm64, cloud)',
    os: 'Almalinux',
    release: '8',
    archs: ['arm64'],
    variant: 'cloud',
    instance_types: [VirtualizationType.Container],
  } as VirtualizationImage,
  'alpine/3.18/default': {
    label: 'Alpine 3.18 (armhf, default)',
    os: 'Alpine',
    release: '3.18',
    archs: ['armhf'],
    variant: 'default',
    instance_types: [VirtualizationType.Container],
  } as VirtualizationImage,
} as Record<string, VirtualizationImage>;

describe('SelectImageDialogComponent', () => {
  let spectator: Spectator<SelectImageDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SelectImageDialogComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([mockCall('virt.instance.image_choices', imageChoices)]),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          remote: VirtualizationRemote.LinuxContainers,
          type: VirtualizationType.Container,
        },
      },
    ],
  });

  describe('dialog without data provider', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows the header', () => {
      expect(spectator.query('h1')).toHaveText('Select Image');
    });

    it('loads image choices', () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'virt.instance.image_choices',
        [{ remote: VirtualizationRemote.LinuxContainers }],
      );
    });

    it('shows the headers', () => {
      expect(spectator.queryAll('th').map((item) => item.textContent)).toEqual([
        'Label',
        'OS',
        'Release',
        'Archs',
        'Variant',
        '',
      ]);
    });

    it('shows the rows', () => {
      const rows = spectator.queryAll('tr').slice(1).map((row) => {
        return Array.from(row.querySelectorAll('td')).map((item) => item.textContent!.trim());
      });

      expect(rows).toEqual([
        ['Almalinux 8 (arm64, cloud)', 'Almalinux', '8', 'arm64', 'cloud', 'Select'],
        ['Alpine 3.18 (armhf, default)', 'Alpine', '3.18', 'armhf', 'default', 'Select'],
      ]);
    });

    it('shows the rows when search string is entered', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Search Images': 'ALPINE',
      });

      const rows = spectator.queryAll('tr').slice(1).map((row) => {
        return Array.from(row.querySelectorAll('td')).map((item) => item.textContent!.trim());
      });

      expect(rows).toEqual([
        ['Alpine 3.18 (armhf, default)', 'Alpine', '3.18', 'armhf', 'default', 'Select'],
      ]);
    });

    it('closes the dialog with the selected image when Select button is pressed', async () => {
      const selectButtons = await loader.getAllHarnesses(
        MatButtonHarness.with({ text: 'Select' }),
      );

      const imageChoicesKeys = Object.keys(imageChoices);
      const imageChoicesValues = Object.values(imageChoices);

      expect(selectButtons).toHaveLength(imageChoicesValues.length);

      await selectButtons[0].click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        id: imageChoicesKeys[0],
        ...imageChoicesValues[0],
      });

      await selectButtons[1].click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        id: imageChoicesKeys[1],
        ...imageChoicesValues[1],
      });
    });

    it('closes the dialog when X icon is pressed', () => {
      spectator.click('#ix-close-icon');

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    });
  });
});
