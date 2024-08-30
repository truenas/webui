import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  InfluxDbServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/influx-db-service/influx-db-service.component';

describe('InfluxDbServiceComponent', () => {
  let spectator: Spectator<InfluxDbServiceComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: InfluxDbServiceComponent,
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
      database: 'my-db',
      host: 'truenas.com',
      password: '12345678',
      series_name: 'AB1234',
      username: 'john',
    });

    const values = await form.getValues();
    expect(values).toEqual({
      Database: 'my-db',
      Host: 'truenas.com',
      Password: '12345678',
      Series: 'AB1234',
      Username: 'john',
    });
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await form.fillForm({
      Database: 'new-db',
      Host: 'new.truenas.com',
      Password: '87654321',
      Series: 'ABC1234',
      Username: 'johny',
    });

    const submittedValues = spectator.component.getSubmitAttributes();
    expect(submittedValues).toEqual({
      database: 'new-db',
      host: 'new.truenas.com',
      password: '87654321',
      series_name: 'ABC1234',
      username: 'johny',
    });
  });
});
