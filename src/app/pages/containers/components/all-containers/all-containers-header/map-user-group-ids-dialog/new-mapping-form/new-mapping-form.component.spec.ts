import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { directIdMapping } from 'app/interfaces/user.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
  let api: TypedApiService;

  const mockUser = { id: 1000, username: 'testuser', uid: 1000 } as WebUiQueryEntity<'user.query'>;
  const mockGroup = { id: 2000, group: 'testgroup', gid: 1000 } as WebUiQueryEntity<'group.query'>;

  const createComponent = createComponentFactory({
    component: NewMappingFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockTypedApi([
        mockTypedQuery('user.query', [mockUser]),
        mockTypedQuery('group.query', [mockGroup]),
        mockTypedCall('user.update', null),
        mockTypedCall('group.update', null),
      ]),
      mockProvider(UserService, mockUserService),
      ...ixFormTestingProviders(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        type: ViewType.Users,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(TypedApiService);
  });

  const getInstanceIdInput = (): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: '[formControlName="instanceUidOrGid"]' }),
  );

  it('shows user combobox when type is Users', () => {
    expect(spectator.query('ix-user-combobox')).toBeTruthy();
  });

  it('shows group combobox when type is Groups', () => {
    spectator.setInput('type', ViewType.Groups);
    spectator.detectChanges();

    expect(spectator.query('ix-group-combobox')).toBeTruthy();
  });

  it('has "Map directly" checkbox checked by default', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness);
    expect(await checkbox.isChecked()).toBe(true);
  });

  it('hides Container UID input when "Map directly" is checked', async () => {
    const inputs = await loader.getAllHarnesses(TnInputHarness);
    expect(inputs).toHaveLength(0);
  });

  it('shows Container UID input when "Map directly" is unchecked', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.uncheck();

    const input = await getInstanceIdInput();
    expect(input).toBeTruthy();
  });

  it('submits form with direct mapping when "Map directly" is checked', async () => {
    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Set' }));
    await submitButton.click();

    expect(api.query).toHaveBeenCalledWith('user.query', [['username', '=', 'testuser']]);
    expect(api.call).toHaveBeenCalledWith('user.update', [1000, { userns_idmap: directIdMapping }]);
  });

  it('submits form with custom UID when "Map directly" is unchecked', async () => {
    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });

    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.uncheck();

    const input = await getInstanceIdInput();
    await input.setValue('2000');

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Set' }));
    await submitButton.click();

    expect(api.query).toHaveBeenCalledWith('user.query', [['username', '=', 'testuser']]);
    expect(api.call).toHaveBeenCalledWith('user.update', [1000, { userns_idmap: 2000 }]);
  });

  it('uses group.update when type is Groups', async () => {
    spectator.setInput('type', ViewType.Groups);
    spectator.component.form.patchValue({ hostUidOrGid: 'testgroup' });

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Set' }));
    await submitButton.click();

    expect(api.query).toHaveBeenCalledWith('group.query', [['group', '=', 'testgroup']]);
    expect(api.call).toHaveBeenCalledWith('group.update', [2000, { userns_idmap: directIdMapping }]);
  });

  it('emits mappingAdded event on successful submit', async () => {
    const emitSpy = jest.fn();
    spectator.component.mappingAdded.subscribe(emitSpy);

    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Set' }));
    await submitButton.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('disables submit button when form is invalid', async () => {
    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(true);
  });

  it('enables submit button when form is valid', async () => {
    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });
    spectator.detectChanges();

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(false);
  });

  it('requires Container UID when "Map directly" is unchecked', async () => {
    spectator.component.form.patchValue({ hostUidOrGid: 'testuser' });

    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.uncheck();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(true);

    const input = await getInstanceIdInput();
    await input.setValue('2000');

    expect(await submitButton.isDisabled()).toBe(false);
  });
});
