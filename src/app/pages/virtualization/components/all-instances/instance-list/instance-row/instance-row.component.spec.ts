import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { InstanceRowComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-row/instance-row.component';

const instance = {
  id: '1',
  name: 'agi_instance',
  status: VirtualizationStatus.Running,
  type: VirtualizationType.Container,
} as VirtualizationInstance;

describe('InstanceRowComponent', () => {
  let spectator: Spectator<InstanceRowComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: InstanceRowComponent,
    imports: [
      MapValuePipe,
    ],
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { instance },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('actions', () => {
    it('shows Stop button when instance is Running', async () => {
      spectator.setInput('instance', {
        ...instance,
        status: VirtualizationStatus.Running,
      });

      const stopIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      const startIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-play-circle' }));
      const restartIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-restart' }));

      expect(stopIcon).toExist();
      expect(restartIcon).toExist();
      expect(startIcon).not.toExist();
    });

    it('shows Start button when instance is Stopped', async () => {
      spectator.setInput('instance', {
        ...instance,
        status: VirtualizationStatus.Stopped,
      });

      const stopIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      const startIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
      const restartIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-restart' }));

      expect(restartIcon).not.toExist();
      expect(stopIcon).not.toExist();
      expect(startIcon).toExist();
    });
  });
});
