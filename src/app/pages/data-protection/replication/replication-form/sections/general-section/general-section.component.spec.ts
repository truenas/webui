import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { Direction } from 'app/enums/direction.enum';
import { LoggingLevel } from 'app/enums/logging-level.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import {
  GeneralSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/general-section/general-section.component';

describe('GeneralSectionComponent', () => {
  let spectator: Spectator<GeneralSectionComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: GeneralSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  it('shows existing values when editing a replication', async () => {
    spectator.setInput('replication', {
      name: 'copy',
      direction: Direction.Pull,
      transport: TransportMode.Ssh,
      retries: 3,
      logging_level: LoggingLevel.Debug,
      enabled: false,
    } as ReplicationTask);

    expect(await (await getInput('name')).getValue()).toBe('copy');
    expect(await (await getSelect('direction')).getDisplayText()).toBe('PULL');
    expect(await (await getSelect('transport')).getDisplayText()).toBe('SSH');
    expect(await (await getInput('retries')).getValue()).toBe('3');
    expect(await (await getSelect('logging_level')).getDisplayText()).toBe('DEBUG');
    expect(await (await getCheckbox('enabled')).isChecked()).toBe(false);
  });

  it('shows default values when creating a new replication', async () => {
    expect(await (await getInput('name')).getValue()).toBe('');
    expect(await (await getSelect('transport')).getDisplayText()).toBe('SSH');
    expect(await (await getInput('retries')).getValue()).toBe('5');
    expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
  });

  it('does not show Direction field when Transport is Local', async () => {
    await (await getSelect('transport')).selectOption('LOCAL');

    const direction = await loader.getHarnessOrNull(TnSelectHarness.with({ selector: '[formControlName="direction"]' }));
    expect(direction).toBeNull();
  });

  it('returns payload with general fields when getPayload() is called', async () => {
    await (await getInput('name')).setValue('replication');
    await (await getSelect('direction')).selectOption('PUSH');
    await (await getSelect('logging_level')).selectOption('INFO');
    await (await getCheckbox('sudo')).check();

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
