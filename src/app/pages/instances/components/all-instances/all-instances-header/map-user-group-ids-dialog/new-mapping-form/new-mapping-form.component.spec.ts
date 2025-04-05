import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { directIdMapping } from 'app/interfaces/user.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ViewType,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/mapping.types';
import {
  NewMappingFormComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/new-mapping-form/new-mapping-form.component';
import { UserService } from 'app/services/user.service';

describe('NewMappingFormComponent', () => {
  let spectator: Spectator<NewMappingFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: NewMappingFormComponent,
    providers: [
      mockApi([
        mockCall('user.update'),
        mockCall('group.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(UserService, {
        userQueryDsCache: jest.fn(() => of([
          { id: 53, username: 'john' },
        ])),
        groupQueryDsCache: jest.fn(() => of([
          { id: 234, group: 'admins' },
        ])),
      }),
    ],
  });

  async function setupTest(type: ViewType): Promise<void> {
    spectator = createComponent({
      props: {
        type,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    jest.spyOn(spectator.component.mappingAdded, 'emit');
  }

  it('creates a new user mapping and emits (mappingAdded)', async () => {
    await setupTest(ViewType.Users);

    await form.fillForm({
      User: 'john',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [53, { userns_idmap: directIdMapping }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.component.mappingAdded.emit).toHaveBeenCalled();
  });

  it('creates a new user mapping with a non-default UID', async () => {
    await setupTest(ViewType.Users);

    await form.fillForm({
      User: 'john',
      'Map to the same UID in the instance': false,
      'Instance UID': 5000,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [53, { userns_idmap: 5000 }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.component.mappingAdded.emit).toHaveBeenCalled();
  });

  it('creates a new group mapping and emits (mappingAdded)', async () => {
    await setupTest(ViewType.Groups);

    await form.fillForm({
      Group: 'admins',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('group.update', [234, { userns_idmap: directIdMapping }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.component.mappingAdded.emit).toHaveBeenCalled();
  });

  it('clears the form if the type is changed afterwards', async () => {
    await setupTest(ViewType.Users);

    await form.fillForm({
      User: 'john',
      'Map to the same UID in the instance': false,
      'Instance UID': 5000,
    });

    spectator.setInput('type', ViewType.Groups);

    expect(await form.getValues()).toEqual({
      Group: '',
      'Map to the same GID in the instance': true,
    });
  });
});
