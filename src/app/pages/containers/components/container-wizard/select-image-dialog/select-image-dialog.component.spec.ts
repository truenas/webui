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
import { ContainerRemote, ContainerType } from 'app/enums/container.enum';
import { ContainerImageRegistryResponse } from 'app/interfaces/container.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { SelectImageDialog } from 'app/pages/containers/components/container-wizard/select-image-dialog/select-image-dialog.component';

const imageChoices: ContainerImageRegistryResponse[] = [
  {
    name: 'almalinux',
    versions: ['8'],
  },
  {
    name: 'alpine',
    versions: ['3.18'],
  },
];

describe('SelectImageDialogComponent', () => {
  let spectator: Spectator<SelectImageDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SelectImageDialog,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([mockCall('container.image.query_registry', imageChoices)]),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          remote: ContainerRemote.LinuxContainers,
          type: ContainerType.Container,
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
        'container.image.query_registry',
        [],
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
        ['almalinux', 'Linux', '8', 'amd64', 'default', 'Select'],
        ['alpine', 'Alpine', '3.18', 'amd64', 'default', 'Select'],
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
        ['alpine', 'Alpine', '3.18', 'amd64', 'default', 'Select'],
      ]);
    });

    it('closes the dialog with the selected image when Select button is pressed', async () => {
      const selectButtons = await loader.getAllHarnesses(
        MatButtonHarness.with({ text: 'Select' }),
      );

      expect(selectButtons).toHaveLength(2);

      await selectButtons[0].click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        id: 'almalinux:8',
        archs: ['amd64'],
        description: 'almalinux container image',
        label: 'almalinux',
        os: 'Linux',
        release: '8',
        variant: 'default',
        instance_types: [ContainerType.Container],
        secureboot: null,
      });

      await selectButtons[1].click();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        id: 'alpine:3.18',
        archs: ['amd64'],
        description: 'alpine container image',
        label: 'alpine',
        os: 'Alpine',
        release: '3.18',
        variant: 'default',
        instance_types: [ContainerType.Container],
        secureboot: null,
      });
    });

    it('closes the dialog when X icon is pressed', () => {
      spectator.click('#ix-close-icon');

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    });

    it('shows empty state when no images match search', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Search Images': 'nonexistent',
      });

      const rows = spectator.queryAll('tr').slice(1);
      expect(rows).toHaveLength(0);
    });

    it('filters images case-insensitively', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Search Images': 'AlMaLiNuX',
      });

      const rows = spectator.queryAll('tr').slice(1).map((row) => {
        return Array.from(row.querySelectorAll('td')).map((item) => item.textContent!.trim());
      });

      expect(rows).toEqual([
        ['almalinux', 'Linux', '8', 'amd64', 'default', 'Select'],
      ]);
    });
  });
});
