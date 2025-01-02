import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  StripAclModalComponent, StripAclModalData,
} from 'app/pages/datasets/modules/permissions/components/strip-acl-modal/strip-acl-modal.component';

describe('StripAclModalComponent', () => {
  let spectator: Spectator<StripAclModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: StripAclModalComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('filesystem.setacl', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
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

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
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
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('strips ACL with traverse when "Remove ACL from children" checkbox is ticked', async () => {
    const traverseCheckbox = await loader.getHarness(
      IxCheckboxHarness.with({ label: helptextAcl.stripACL_dialog.traverse_checkbox }),
    );
    await traverseCheckbox.setValue(true);

    const stripButton = await loader.getHarness(MatButtonHarness.with({ text: 'Strip ACLs' }));
    await stripButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
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
