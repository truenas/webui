import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnRadioHarness } from '@truenas/ui-components';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';

describe('ReplicationWhenComponent', () => {
  let spectator: Spectator<ReplicationWhenComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ReplicationWhenComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockAuth(),
      mockApi(),
    ],
  });

  const setRadio = async (label: string): Promise<void> => {
    await (await loader.getHarness(TnRadioHarness.with({ label }))).check();
  };

  beforeEach(async () => {
    spectator = createComponent();
    spectator.setInput('isSourceLocal', true);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    await setRadio('Custom');
  });

  it('returns fields when getPayload() is called', () => {
    expect(spectator.component.getPayload()).toEqual({
      schedule_method: ScheduleMethod.Cron,
      schedule_picker: '0 0 * * *',
      source_lifetime_value: 2,
      source_lifetime_unit: LifetimeUnit.Week,
      retention_policy: RetentionPolicy.Custom,
      lifetime_value: 2,
      lifetime_unit: LifetimeUnit.Week,
    });
  });

  it('returns summary when getSummary() is called', () => {
    expect(spectator.component.getSummary()).toEqual([
      { label: 'Replication Schedule', value: 'Run On a Schedule' },
      { label: 'Source Snapshot Lifetime', value: '2 Week(s)' },
    ]);
  });

  it('excludes source lifetime fields from payload when Run Once is selected', async () => {
    await setRadio('Run Once');

    const payload = spectator.component.getPayload();
    expect(payload.source_lifetime_value).toBeUndefined();
    expect(payload.source_lifetime_unit).toBeUndefined();
  });

  it('excludes source lifetime fields from payload when source is not local', () => {
    spectator.setInput('isSourceLocal', false);

    const payload = spectator.component.getPayload();
    expect(payload.source_lifetime_value).toBeUndefined();
    expect(payload.source_lifetime_unit).toBeUndefined();
  });

  it('emits (save) when Save is selected', async () => {
    jest.spyOn(spectator.component.save, 'emit');
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    expect(spectator.component.save.emit).toHaveBeenCalled();
  });
});
