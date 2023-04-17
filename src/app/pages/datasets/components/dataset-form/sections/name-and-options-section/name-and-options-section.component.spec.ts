import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetCaseSensitivity, DatasetSync } from 'app/enums/dataset.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxFieldsetHarness } from 'app/modules/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  NameAndOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/name-and-options-section/name-and-options-section.component';

describe('NameAndOptionsSectionComponent', () => {
  let spectator: Spectator<NameAndOptionsSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const existingChildDataset = {
    name: 'parent/child',
    comments: {
      value: 'comments',
      source: ZfsPropertySource.Inherited,
      parsed: 'comments',
    },
    sync: {
      parsed: 'standard',
      source: ZfsPropertySource.Inherited,
      value: DatasetSync.Standard,
    },
    compression: {
      parsed: 'lzjb',
      value: 'LZJB',
      source: ZfsPropertySource.Local,
    },
    atime: {
      parsed: false,
      value: OnOff.Off,
      source: ZfsPropertySource.Inherited,
    },
  } as Dataset;
  const parentDataset = {
    name: 'parent',
    comments: {
      value: 'comments',
      source: ZfsPropertySource.Local,
      parsed: 'comments',
    },
    sync: {
      parsed: 'standard',
      source: ZfsPropertySource.Default,
      value: DatasetSync.Standard,
    },
    compression: {
      parsed: 'lzjb',
      value: 'LZJB',
      source: ZfsPropertySource.Local,
    },
    atime: {
      parsed: false,
      value: OnOff.Off,
      source: ZfsPropertySource.Local,
    },
    casesensitivity: {
      value: DatasetCaseSensitivity.Sensitive,
      source: ZfsPropertySource.Local,
    },
    children: [],
  } as Dataset;

  const createComponent = createComponentFactory({
    component: NameAndOptionsSectionComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.compression_choices', {
          LZ4: 'LZ4',
          LZJB: 'LZJB',
          OFF: 'OFF',
        }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  describe('new dataset', () => {
    it('shows form for new dataset', async () => {
      spectator.setInput({
        existing: null,
        parent: parentDataset,
      });

      const values = await form.getValues();
      expect(values).toEqual({
        'Parent Path': 'parent',
        Name: '',
        Comments: '',
        Sync: 'Inherit (STANDARD)',
        'Compression Level': 'Inherit (LZJB)',
        'Enable Atime': 'Inherit (OFF)',
      });
    });

    it('returns payload for updating a dataset', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      await form.fillForm({
        Name: 'new-dataset',
        Comments: 'My new dataset',
        Sync: 'Always',
        'Compression Level': 'Inherit (LZJB)',
        'Enable Atime': 'On',
      });

      expect(spectator.component.getPayload()).toEqual({
        name: 'parent/new-dataset',
        atime: OnOff.On,
        comments: 'My new dataset',
        compression: inherit,
        sync: DatasetSync.Always,
      });
    });
  });

  describe('existing dataset', () => {
    it('shows form for editing an existing root dataset', async () => {
      spectator.setInput({
        existing: {
          name: 'pool1',
          comments: {
            value: 'comments',
            source: ZfsPropertySource.Local,
            parsed: 'comments',
          },
          sync: {
            parsed: 'standard',
            source: ZfsPropertySource.Default,
            value: DatasetSync.Standard,
          },
          compression: {
            parsed: 'lzjb',
            value: 'LZJB',
            source: ZfsPropertySource.Local,
          },
          atime: {
            parsed: false,
            value: OnOff.Off,
            source: ZfsPropertySource.Local,
          },
        } as Dataset,
        parent: null,
      });

      const values = await form.getValues();
      expect(values).toEqual({
        Name: 'pool1',
        Comments: 'comments',
        Sync: 'Standard',
        'Compression Level': 'LZJB',
        'Enable Atime': 'Off',
      });
    });

    it('shows form for editing an existing child dataset', async () => {
      spectator.setInput({
        existing: existingChildDataset,
        parent: parentDataset,
      });

      const values = await form.getValues();
      expect(values).toEqual({
        Name: 'parent/child',
        Comments: '',
        'Compression Level': 'LZJB',
        'Enable Atime': 'Inherit (OFF)',
        Sync: 'Inherit (STANDARD)',
      });
    });

    it('returns payload for updating a dataset', async () => {
      spectator.setInput({
        existing: existingChildDataset,
        parent: parentDataset,
      });

      await form.fillForm({
        Comments: 'My updated dataset',
        Sync: 'Always',
        'Compression Level': 'LZ4',
        'Enable Atime': 'Off',
      });

      expect(spectator.component.getPayload()).toEqual({
        comments: 'My updated dataset',
        atime: OnOff.Off,
        compression: 'LZ4',
        sync: DatasetSync.Always,
      });
    });
  });

  describe('name control', () => {
    it('does not allow names that are already present as children in the parent', async () => {
      spectator.setInput({
        parent: {
          ...parentDataset,
          children: [
            {
              name: 'parent/in-use',
            },
          ] as Dataset[],
        },
      });

      const nameControl = await form.getControl('Name') as IxInputHarness;
      await nameControl.setValue('in-use');

      expect(await nameControl.getErrorText()).not.toBeNull();
    });
  });
});
