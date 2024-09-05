import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxChipsHarness } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  TelegramServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/telegram-service/telegram-service.component';

describe('TelegramServiceComponent', () => {
  let spectator: Spectator<TelegramServiceComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: TelegramServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('renders a form with alert service values', async () => {
    spectator.component.form.patchValue({
      bot_token: 'token1',
      chat_ids: [1111, 2222],
    });

    const values = await form.getValues();
    expect(values).toEqual({
      'Bot API Token': 'token1',
      'List of chat IDs': ['1111', '2222'],
    });
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await form.fillForm({
      'Bot API Token': 'token2',
      'List of chat IDs': ['2222', '3333'],
    });

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      bot_token: 'token2',
      chat_ids: [2222, 3333],
    });
  });

  it('shows a validation error when a non-numeric value is entered in List of chat IDs', async () => {
    const chatIdsInput = await form.getControl('List of chat IDs') as IxChipsHarness;
    await chatIdsInput.setValue(['borked']);

    const error = await chatIdsInput.getErrorText();
    expect(error).toBe('Only numeric ids are allowed.');
  });

  it('allows minus sign in front of Chat IDs', async () => {
    const chatIdsInput = await form.getControl('List of chat IDs') as IxChipsHarness;
    await chatIdsInput.setValue(['-12345']);

    const error = await chatIdsInput.getErrorText();
    expect(error).toBe('');
  });
});
