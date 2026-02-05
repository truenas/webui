import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { directIdMapping } from 'app/interfaces/user.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';
import { NewMappingFormComponent } from './new-mapping-form.component';
import { MappingType } from '../mapping.types';

describe('NewMappingFormComponent', () => {
  let spectator: Spectator<NewMappingFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: NewMappingFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('user.update'),
        mockCall('group.update'),
      ]),
      mockProvider(UserService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        mappingType: MappingType.Users,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows user combobox when mapping type is Users', async () => {
    const combobox = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
    expect(combobox).toBeTruthy();
  });

  it('shows group combobox when mapping type is Groups', async () => {
    spectator.setInput('mappingType', MappingType.Groups);

    const combobox = await loader.getHarness(IxComboboxHarness.with({ label: 'Group' }));
    expect(combobox).toBeTruthy();
  });

  it('has "Map directly" checkbox checked by default', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Map to the same UID/GID in the container' }));
    expect(await checkbox.getValue()).toBe(true);
  });

  it('hides Container UID input when "Map directly" is checked', async () => {
    const inputs = await loader.getAllHarnesses(IxInputHarness);
    expect(inputs).toHaveLength(0);
  });

  it('shows Container UID input when "Map directly" is unchecked', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Map to the same UID/GID in the container' }));
    await checkbox.setValue(false);

    const input = await loader.getHarness(IxInputHarness.with({ label: 'Container UID' }));
    expect(input).toBeTruthy();
  });

  it('submits form with direct mapping when "Map directly" is checked', async () => {
    jest.spyOn(api, 'call').mockReturnValue(of(null));

    const combobox = await loader.getHarness(IxComboboxHarness);
    await combobox.setValue('1000');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(api.call).toHaveBeenCalledWith('user.update', [1000, { userns_idmap: directIdMapping }]);
  });

  it('submits form with custom UID when "Map directly" is unchecked', async () => {
    jest.spyOn(api, 'call').mockReturnValue(of(null));

    const combobox = await loader.getHarness(IxComboboxHarness);
    await combobox.setValue('1000');

    const checkbox = await loader.getHarness(IxCheckboxHarness);
    await checkbox.setValue(false);

    const input = await loader.getHarness(IxInputHarness.with({ label: 'Container UID' }));
    await input.setValue('2000');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(api.call).toHaveBeenCalledWith('user.update', [1000, { userns_idmap: 2000 }]);
  });

  it('uses group.update when mapping type is Groups', async () => {
    spectator.setInput('mappingType', MappingType.Groups);
    jest.spyOn(api, 'call').mockReturnValue(of(null));

    const combobox = await loader.getHarness(IxComboboxHarness);
    await combobox.setValue('1000');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(api.call).toHaveBeenCalledWith('group.update', [1000, { userns_idmap: directIdMapping }]);
  });

  it('emits mappingAdded event on successful submit', async () => {
    jest.spyOn(api, 'call').mockReturnValue(of(null));
    jest.spyOn(spectator.component.mappingAdded, 'emit');

    const combobox = await loader.getHarness(IxComboboxHarness);
    await combobox.setValue('1000');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(spectator.component.mappingAdded.emit).toHaveBeenCalled();
  });

  it('resets form after successful submit', async () => {
    jest.spyOn(api, 'call').mockReturnValue(of(null));

    const combobox = await loader.getHarness(IxComboboxHarness);
    await combobox.setValue('1000');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    await submitButton.click();

    expect(spectator.component.form.value).toEqual({
      hostUidOrGid: null,
      mapDirectly: true,
      instanceUidOrGid: null,
    });
  });

  it('disables submit button when form is invalid', async () => {
    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(true);
  });

  it('enables submit button when form is valid', async () => {
    const combobox = await loader.getHarness(IxComboboxHarness);
    await combobox.setValue('1000');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(false);
  });

  it('requires Container UID when "Map directly" is unchecked', async () => {
    const checkbox = await loader.getHarness(IxCheckboxHarness);
    await checkbox.setValue(false);

    const combobox = await loader.getHarness(IxComboboxHarness);
    await combobox.setValue('1000');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Set' }));
    expect(await submitButton.isDisabled()).toBe(true);

    const input = await loader.getHarness(IxInputHarness.with({ label: 'Container UID' }));
    await input.setValue('2000');

    expect(await submitButton.isDisabled()).toBe(false);
  });
});
