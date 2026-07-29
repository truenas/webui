import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  AwsSnsServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/aws-sns-service/aws-sns-service.component';

describe('AwsSnsServiceComponent', () => {
  let spectator: Spectator<AwsSnsServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AwsSnsServiceComponent,
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
      region: 'us-east-1',
      topic_arn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
      aws_access_key_id: 'AKIAEXAMPLE',
      aws_secret_access_key: 'wJalEXAMPLEKEY',
    });

    expect(await (await getInput('region')).getValue()).toBe('us-east-1');
    expect(await (await getInput('topic_arn')).getValue()).toBe('arn:aws:sns:us-east-1:123456789012:MyTopic');
    expect(await (await getInput('aws_access_key_id')).getValue()).toBe('AKIAEXAMPLE');
    expect(await (await getInput('aws_secret_access_key')).getValue()).toBe('wJalEXAMPLEKEY');
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('region')).setValue('us-west-1');
    await (await getInput('topic_arn')).setValue('arn:aws:newarn');
    await (await getInput('aws_access_key_id')).setValue('NEWKEYID');
    await (await getInput('aws_secret_access_key')).setValue('NEWSECRETKEY');

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      topic_arn: 'arn:aws:newarn',
      region: 'us-west-1',
      aws_access_key_id: 'NEWKEYID',
      aws_secret_access_key: 'NEWSECRETKEY',
    });
  });
});
