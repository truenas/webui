import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  StripAclModalComponent, StripAclModalData,
} from 'app/pages/datasets/modules/permissions/components/strip-acl-modal/strip-acl-modal.component';

describe('StripAclModalComponent', () => {
  let spectator: Spectator<StripAclModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: StripAclModalComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          path: '/mnt/tank/test',
        } as StripAclModalData,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('strips ACL when dialog is submitted', async () => {
    const stripButton = await loader.getHarness(MatButtonHarness.with({ text: 'Strip ACLs' }));
    await stripButton.click();

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
      'filesystem.setacl',
      [{
        dacl: [],
        options: {
          recursive: true,
          stripacl: true,
          traverse: false,
        },
        path: '/mnt/tank/test',
      }],
    );
    expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('strips ACL with traverse when "Remove ACL from children" checkbox is ticked', async () => {
    const traverseCheckbox = await loader.getHarness(
      IxCheckboxHarness.with({ label: helptext.stripACL_dialog.traverse_checkbox }),
    );
    await traverseCheckbox.setValue(true);

    const stripButton = await loader.getHarness(MatButtonHarness.with({ text: 'Strip ACLs' }));
    await stripButton.click();

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
      'filesystem.setacl',
      [{
        dacl: [],
        options: {
          recursive: true,
          stripacl: true,
          traverse: true,
        },
        path: '/mnt/tank/test',
      }],
    );
  });
});
