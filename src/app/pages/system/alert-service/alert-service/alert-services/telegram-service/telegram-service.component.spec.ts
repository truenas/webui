import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnChipInputHarness, TnFormFieldHarness, TnInputHarness } from '@truenas/ui-components';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import {
  TelegramServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/telegram-service/telegram-service.component';

describe('TelegramServiceComponent', () => {
  let spectator: Spectator<TelegramServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: TelegramServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      provideTnFormFieldErrors(),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const getChips = (name: string): Promise<TnChipInputHarness> => loader.getHarness(
    TnChipInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders a form with alert service values', async () => {
    spectator.component.form.patchValue({
      bot_token: 'token1',
      chat_ids: [1111, 2222],
    });

    expect(await (await getInput('bot_token')).getValue()).toBe('token1');
    expect(await (await getChips('chat_ids')).getChips()).toEqual(['1111', '2222']);
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('bot_token')).setValue('token2');

    const chips = await getChips('chat_ids');
    await chips.addChip('2222');
    await chips.addChip('3333');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      bot_token: 'token2',
      chat_ids: [2222, 3333],
    });
  });

  it('shows a validation error when a non-numeric value is entered in List of chat IDs', async () => {
    await (await getChips('chat_ids')).addChip('borked');

    const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'List of chat IDs' }));
    expect(await field.getErrorMessage()).toBe('Only numeric ids are allowed.');
  });

  it('allows minus sign in front of Chat IDs', async () => {
    await (await getChips('chat_ids')).addChip('-12345');

    const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'List of chat IDs' }));
    expect(await field.hasError()).toBe(false);
  });
});
