import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import {
  DialogService, StorageService, UserService, WebSocketService,
} from 'app/services';
import { DatasetTrivialPermissionsComponent } from './dataset-trivial-permissions.component';

describe('DatasetTrivialPermissionsComponent', () => {
  let spectator: Spectator<DatasetTrivialPermissionsComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let websocket: WebSocketService;
  let saveButton: MatButtonHarness;
  const createComponent = createRoutingFactory({
    component: DatasetTrivialPermissionsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      EntityModule,
    ],
    params: {
      datasetId: 'pool/trivial',
    },
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.query', [{
          acltype: {
            value: AclType.Posix1e,
          },
        } as Dataset]),
        mockJob('pool.dataset.permission'),
      ]),
      mockProvider(StorageService, {
        filesystemStat: jest.fn(() => of({
          mode: 16877,
          user: 'root',
          group: 'kmem',
        })),
      }),
      mockProvider(UserService, {
        groupQueryDsCache: () => of([
          { group: 'kmem' },
          { group: 'wheel' },
        ]),
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'games' },
        ]),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    websocket = spectator.inject(WebSocketService);
    saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
  });

  it('shows path of the dataset being edited', () => {
    const datasetPath = spectator.query('.dataset-path');

    expect(datasetPath).toHaveText('Dataset:/mnt/pool/trivial');
  });

  it('shows current setting owner and access information', async () => {
    const values = await form.getValues();

    expect(values).toEqual({
      'Access Mode': '755',
      User: 'root',
      'Apply User': false,
      Group: 'kmem',
      'Apply Group': false,
      'Apply permissions recursively': false,
    });
  });

  it('saves new user and group when form is saved', async () => {
    await form.fillForm({
      User: 'games',
      Group: 'kmem',
      'Apply User': true,
      'Apply Group': true,
    });

    await saveButton.click();

    expect(websocket.job).toHaveBeenCalledWith('pool.dataset.permission', [
      'pool/trivial',
      {
        user: 'games',
        group: 'kmem',
        acl: [],
        options: {
          recursive: false,
          stripacl: false,
          traverse: false,
        },
      },
    ]);
  });

  it('saves permissions when they are saved', async () => {
    await form.fillForm({
      'Access Mode': '777',
    });

    await saveButton.click();

    expect(websocket.job).toHaveBeenCalledWith('pool.dataset.permission', [
      'pool/trivial',
      {
        mode: '777',
        acl: [],
        options: {
          recursive: false,
          stripacl: true,
          traverse: false,
        },
      },
    ]);
  });

  it('shows a warning when Recursive checkbox is pressed', async () => {
    await form.fillForm({
      'Apply permissions recursively': true,
    });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Warning',
      }),
    );
  });

  it('saves permissions recursively and with traverse when advanced checkboxes are checked', async () => {
    await form.fillForm({
      'Access Mode': '555',
      'Apply permissions recursively': true,
    });
    await form.fillForm({
      'Apply permissions to child datasets': true,
    });

    await saveButton.click();

    expect(websocket.job).toHaveBeenCalledWith('pool.dataset.permission', [
      'pool/trivial',
      {
        mode: '555',
        acl: [],
        options: {
          recursive: true,
          stripacl: true,
          traverse: true,
        },
      },
    ]);
  });

  it('goes to ACL editor when Set ACL is pressed', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const setAclButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set ACL' }));
    await setAclButton.click();

    expect(router.navigate).toHaveBeenCalledWith(['/datasets', 'pool/trivial', 'permissions', 'acl']);
  });
});
