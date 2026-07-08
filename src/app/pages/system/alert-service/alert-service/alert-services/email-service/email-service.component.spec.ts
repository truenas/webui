import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  EmailServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/email-service/email-service.component';

describe('EmailServiceComponent', () => {
  let spectator: Spectator<EmailServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EmailServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders a form with alert service values', async () => {
    spectator.component.form.patchValue({
      email: 'me@truenas.com',
    });

    expect(await (await getInput('email')).getValue()).toBe('me@truenas.com');
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('email')).setValue('new@truenas.com');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      email: 'new@truenas.com',
    });
  });
});
