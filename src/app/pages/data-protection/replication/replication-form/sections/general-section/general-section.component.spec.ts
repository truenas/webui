import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { Direction } from 'app/enums/direction.enum';
import { LoggingLevel } from 'app/enums/logging-level.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import {
  GeneralSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/general-section/general-section.component';

describe('GeneralSectionComponent', () => {
  let spectator: Spectator<GeneralSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;
  const createComponent = createComponentFactory({
    component: GeneralSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  it('shows existing values when editing a replication', async () => {
    spectator.setInput('replication', {
      name: 'copy',
      direction: Direction.Pull,
      transport: TransportMode.Ssh,
      retries: 3,
      logging_level: LoggingLevel.Debug,
      enabled: false,
    } as ReplicationTask);

    expect(await form.getValues()).toEqual({
      Name: 'copy',
      Direction: 'PULL',
      Transport: 'SSH',
      'Number of retries for failed replications': '3',
      'Logging Level': 'DEBUG',
      'Use Sudo For ZFS Commands': false,
      Enabled: false,
    });
  });

  it('shows default values when creating a new replication', async () => {
    expect(await form.getValues()).toEqual({
      Name: '',
      Direction: Direction.Push,
      Transport: TransportMode.Ssh,
      'Number of retries for failed replications': '5',
      'Logging Level': LoggingLevel.Default,
      'Use Sudo For ZFS Commands': false,
      Enabled: true,
    });
  });

  it('does not show Direction field when Transport is Local', async () => {
    await form.fillForm({
      Transport: TransportMode.Local,
    });

    expect(await form.getLabels()).not.toContain('Direction');
  });

  it('returns payload with general fields when getPayload() is called', async () => {
    await form.fillForm({
      Name: 'replication',
      Direction: 'PUSH',
      'Logging Level': 'INFO',
      'Use Sudo For ZFS Commands': true,
    });

    expect(spectator.component.getPayload()).toEqual({
      name: 'replication',
      direction: Direction.Push,
      transport: TransportMode.Ssh,
      retries: 5,
      logging_level: LoggingLevel.Info,
      sudo: true,
      enabled: true,
    });
  });
});
