import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnFormFieldHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { DatasetCaseSensitivity, DatasetPreset } from 'app/enums/dataset.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import {
  NameAndOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/name-and-options-section/name-and-options-section.component';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';

describe('NameAndOptionsSectionComponent', () => {
  let spectator: Spectator<NameAndOptionsSectionComponent>;
  let loader: HarnessLoader;
  const existingChildDataset = {
    name: 'parent/child',
  } as Dataset;
  const parentDataset = {
    name: 'parent',
    casesensitivity: {
      value: DatasetCaseSensitivity.Sensitive,
      source: ZfsPropertySource.Local,
    },
    children: [] as Dataset[],
  } as Dataset;

  const createComponent = createComponentFactory({
    component: NameAndOptionsSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SmbValidationService),
    ],
  });

  const getNameInput = (): Promise<TnInputHarness> => {
    return loader.getHarness(TnInputHarness.with({ selector: '[formControlName="name"]' }));
  };

  const getPresetSelect = (): Promise<TnSelectHarness> => {
    return loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="share_type"]' }));
  };

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('new dataset', () => {
    it('shows form for new dataset', async () => {
      spectator.setInput({
        existing: undefined,
        parent: parentDataset,
      });

      const details = await (await loader.getHarness(DetailsTableHarness)).getValues();
      expect(details).toEqual({
        'Parent Path:': 'parent',
      });

      expect(await (await getNameInput()).getValue()).toBe('');
      expect(await (await getPresetSelect()).getDisplayText()).toBe('Generic');
    });

    it('returns payload for updating a dataset', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      await (await getNameInput()).setValue('new-dataset');
      await (await getPresetSelect()).selectOption('Apps');

      expect(spectator.component.getPayload()).toEqual({
        name: 'parent/new-dataset',
        share_type: 'APPS',
      });
    });
  });

  describe('existing dataset', () => {
    it('shows form for editing an existing root dataset', async () => {
      spectator.setInput({
        existing: {
          name: 'pool1',
          share_type: {
            parsed: 'Multiprotocol',
            source: ZfsPropertySource.Default,
            value: DatasetPreset.Multiprotocol,
          },
        } as Dataset,
        parent: undefined,
      });

      expect(await (await getNameInput()).getValue()).toBe('pool1');
    });

    it('shows form for editing an existing child dataset', async () => {
      spectator.setInput({
        existing: existingChildDataset,
        parent: parentDataset,
      });

      expect(await (await getNameInput()).getValue()).toBe('parent/child');
    });

    it('returns payload for updating a dataset', () => {
      spectator.setInput({
        existing: existingChildDataset,
        parent: parentDataset,
      });

      expect(spectator.component.getPayload()).toEqual({});
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

      await (await getNameInput()).setValue('in-use');

      const nameField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }));
      expect(await nameField.getErrorMessage()).not.toBeNull();
    });

    it('emits invalid state when name is empty on form initialization', () => {
      const emitSpy = jest.spyOn(spectator.component.formValidityChange, 'emit');

      spectator.setInput({
        parent: parentDataset,
      });

      // Should emit false because name is required but empty
      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it('does not show validation errors immediately when form opens with empty name', () => {
      spectator.setInput({
        parent: parentDataset,
      });

      const nameControl = spectator.component.form.controls.name;

      // Field should be invalid but untouched and pristine
      expect(nameControl.invalid).toBe(true);
      expect(nameControl.untouched).toBe(true);
      expect(nameControl.pristine).toBe(true);
    });

    it('emits valid state when valid name is entered', async () => {
      spectator.setInput({
        parent: parentDataset,
      });

      const emitSpy = jest.spyOn(spectator.component.formValidityChange, 'emit');
      emitSpy.mockClear(); // Clear previous calls from initialization

      await (await getNameInput()).setValue('valid-dataset-name');

      // Should emit true because name is now valid
      expect(emitSpy).toHaveBeenCalledWith(true);
    });

    it('marks name field as untouched after validators are added', () => {
      spectator.setInput({
        parent: parentDataset,
      });

      const nameControl = spectator.component.form.controls.name;

      // Validators should be working (field is invalid when empty)
      expect(nameControl.invalid).toBe(true);
      expect(nameControl.errors).toBeTruthy();
      // Field should still be untouched to prevent showing errors
      expect(nameControl.untouched).toBe(true);
    });
  });
});
