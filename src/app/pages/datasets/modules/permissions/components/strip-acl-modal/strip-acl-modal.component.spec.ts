import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
      mockTypedApi([
        mockTypedJob('filesystem.setacl', { state: JobState.Success }),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
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
    const stripButton = await loader.getHarness(TnButtonHarness.with({ label: 'Strip ACLs' }));
    await stripButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith(
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
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('strips ACL with traverse when "Remove ACL from children" checkbox is ticked', async () => {
    const traverseCheckbox = await loader.getHarness(
      TnCheckboxHarness.with({ label: helptextAcl.stripAclDialog.traverseCheckbox }),
    );
    await traverseCheckbox.check();

    const stripButton = await loader.getHarness(TnButtonHarness.with({ label: 'Strip ACLs' }));
    await stripButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith(
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
