import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  AwsSnsServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/aws-sns-service/aws-sns-service.component';

describe('AwsSnsServiceComponent', () => {
  let spectator: Spectator<AwsSnsServiceComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: AwsSnsServiceComponent,
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
      region: 'us-east-1',
      topic_arn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
      aws_access_key_id: 'AKIAEXAMPLE',
      aws_secret_access_key: 'wJalEXAMPLEKEY',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      ARN: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
      'AWS Region': 'us-east-1',
      'Key ID': 'AKIAEXAMPLE',
      'Secret Key': 'wJalEXAMPLEKEY',
    });
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await form.fillForm({
      ARN: 'arn:aws:newarn',
      'AWS Region': 'us-west-1',
      'Key ID': 'NEWKEYID',
      'Secret Key': 'NEWSECRETKEY',
    });

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      topic_arn: 'arn:aws:newarn',
      region: 'us-west-1',
      aws_access_key_id: 'NEWKEYID',
      aws_secret_access_key: 'NEWSECRETKEY',
    });
  });
});
