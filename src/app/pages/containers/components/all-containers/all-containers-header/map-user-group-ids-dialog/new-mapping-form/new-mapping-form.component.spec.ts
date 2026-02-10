import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Group } from 'app/interfaces/group.interface';
import { directIdMapping, User } from 'app/interfaces/user.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { ViewType } from 'app/pages/containers/components/all-containers/all-containers-header/map-user-group-ids-dialog/mapping.types';
import { UserService } from 'app/services/user.service';
import { NewMappingFormComponent } from './new-mapping-form.component';

const mockUserService = {
  userQueryDsCache: jest.fn(() => of([])),
  groupQueryDsCache: jest.fn(() => of([])),
  getUserByNameCached: jest.fn(() => of(null)),
  getGroupByNameCached: jest.fn(() => of(null)),
};

describe('NewMappingFormComponent', () => {
  let spectator: Spectator<NewMappingFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const mockUser: User = { id: 1000, username: 'testuser', uid: 1000 } as User;
  const mockGroup: Group = { id: 2000, group: 'testgroup', gid: 1000 } as Group;

  const createComponent = createComponentFactory({
    component: NewMappingFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('user.query', [mockUser]),
        mockCall('group.query', [mockGroup]),
        mockCall('user.update'),
        mockCall('group.update'),
      ]),
      mockProvider(UserService, mockUserService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        type: ViewType.Users,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows user combobox when type is Users', () => {
    expect(spectator.query('ix-user-combobox')).toBeTruthy();
  });

  it('shows group combobox when type is Groups', () => {
    spectator.setInput('type', ViewType.Groups);
    spectator.detectChanges();

    expect(spectator.query('ix-group-combobox')).toBeTruthy();
  });

  it('has "Map directly" checkbox checked by default', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness);
    expect(await checkbox.getValue()).toBe(true);
  });

  it('hides Container UID input when "Map directly" is checked', async () => {
    const inputs = await loader.getAllHarnesses(IxInputHarness);
    expect(inputs).toHaveLength(0);
  });

  it('shows Container UID input when "Map directly" is unchecked', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness);
    await checkbox.setValue(false);

    const input = await loader.getHarness(IxInputHarness.with({ label: 'Container UID' }));
    expect(input).toBeTruthy();
  });

  it('submits form with direct mapping when "Map directly" is checked', async () => {
    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(api.call).toHaveBeenCalledWith('user.query', [[['username', '=', 'testuser']]]);
    expect(api.call).toHaveBeenCalledWith('user.update', [1000, { userns_idmap: directIdMapping }]);
  });

  it('submits form with custom UID when "Map directly" is unchecked', async () => {
    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });

    const checkbox = await loader.getHarness(IxCheckboxHarness);
    await checkbox.setValue(false);

    const input = await loader.getHarness(IxInputHarness.with({ label: 'Container UID' }));
    await input.setValue('2000');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(api.call).toHaveBeenCalledWith('user.query', [[['username', '=', 'testuser']]]);
    expect(api.call).toHaveBeenCalledWith('user.update', [1000, { userns_idmap: 2000 }]);
  });

  it('uses group.update when type is Groups', async () => {
    spectator.setInput('type', ViewType.Groups);
    spectator.component.form.patchValue({ hostUidOrGid: 'testgroup' });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(api.call).toHaveBeenCalledWith('group.query', [[['group', '=', 'testgroup']]]);
    expect(api.call).toHaveBeenCalledWith('group.update', [2000, { userns_idmap: directIdMapping }]);
  });

  it('emits mappingAdded event on successful submit', async () => {
    const emitSpy = jest.fn();
    spectator.component.mappingAdded.subscribe(emitSpy);

    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('disables submit button when form is invalid', async () => {
    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(true);
  });

  it('enables submit button when form is valid', async () => {
    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });
    spectator.detectChanges();

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(false);
  });

  it('requires Container UID when "Map directly" is unchecked', async () => {
    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });

    const checkbox = await loader.getHarness(IxCheckboxHarness);
    await checkbox.setValue(false);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(true);

    const input = await loader.getHarness(IxInputHarness.with({ label: 'Container UID' }));
    await input.setValue('2000');

    expect(await submitButton.isDisabled()).toBe(false);
  });
});
