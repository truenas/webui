import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsItemHarness } from 'app/modules/details-table/details-item/details-item.harness';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';

/**
 * Specifically tests harnesses.
 */
describe('DetailsTableHarness', () => {
  let spectator: SpectatorHost<DetailsTableComponent>;
  let loader: HarnessLoader;
  let details: DetailsTableHarness;
  const createHost = createHostFactory({
    component: DetailsTableComponent,
    imports: [
      DetailsItemComponent,
      ReactiveFormsModule,
      EditableComponent,
    ],
  });

  const form = new FormGroup({
    firstName: new FormControl('Manuel'),
    lastName: new FormControl('Garcia'),
  });

  beforeEach(async () => {
    spectator = createHost(`
      <ix-details-table [formGroup]="form">
        <ix-details-item label="First Name">
          {{ form.value.firstName }}
        </ix-details-item>

        <ix-details-item label="Last Name">
          <ix-editable>
            <div view> {{ form.value.lastName }}</div>
            <div edit>
              <ix-input formControlName="lastName"></ix-input>
            </div>
          </ix-editable>
        </ix-details-item>
      </ix-details-table>
    `, {
      hostProps: {
        form,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    details = await loader.getHarness(DetailsTableHarness);
  });

  describe('getValues', () => {
    it('returns text content for all items', async () => {
      const values = await details.getValues();
      expect(values).toEqual({
        'First Name': 'Manuel',
        'Last Name': 'Garcia',
      });
    });
  });

  describe('getItemByLabel', () => {
    it('returns DetailsItemHarness for a specific item', async () => {
      const item = await details.getItemByLabel('First Name');
      expect(item).toBeInstanceOf(DetailsItemHarness);
      expect(await item.getLabelText()).toBe('First Name');
    });
  });

  describe('getHarnessForItem', () => {
    it('returns harness found in specific details item', async () => {
      const lastNameEditable = await details.getHarnessForItem('Last Name', EditableHarness);
      await lastNameEditable.setFirstControlValue('Gonzalez');

      await lastNameEditable.tryToClose();

      expect(await details.getValues()).toEqual({
        'First Name': 'Manuel',
        'Last Name': 'Gonzalez',
      });
    });
  });
});
