import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import {
  InfluxDbServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/influx-db-service/influx-db-service.component';

describe('InfluxDbServiceComponent', () => {
  let spectator: Spectator<InfluxDbServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InfluxDbServiceComponent,
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
      database: 'my-db',
      host: 'truenas.com',
      password: '12345678',
      series_name: 'AB1234',
      username: 'john',
    });

    expect(await (await getInput('host')).getValue()).toBe('truenas.com');
    expect(await (await getInput('username')).getValue()).toBe('john');
    expect(await (await getInput('password')).getValue()).toBe('12345678');
    expect(await (await getInput('database')).getValue()).toBe('my-db');
    expect(await (await getInput('series_name')).getValue()).toBe('AB1234');
  });

  it('returns alert service form values when getSubmitAttributes is called', async () => {
    await (await getInput('host')).setValue('new.truenas.com');
    await (await getInput('username')).setValue('johny');
    await (await getInput('password')).setValue('87654321');
    await (await getInput('database')).setValue('new-db');
    await (await getInput('series_name')).setValue('ABC1234');

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
