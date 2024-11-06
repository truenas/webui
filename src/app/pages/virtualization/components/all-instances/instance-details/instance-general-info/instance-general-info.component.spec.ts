import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { InstanceGeneralInfoComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-general-info.component';

const demoInstance = {
  id: 'demo',
  name: 'Demo',
  type: 'CONTAINER',
  status: 'RUNNING',
  cpu: '525',
  autostart: true,
  image: {
    architecture: 'amd64',
    description: 'Almalinux 8 amd64 (20241030_23:38)',
    os: 'Almalinux',
    release: '8',
  },
  memory: 131072000,
} as unknown as VirtualizationInstance;

describe('InstanceGeneralInfoComponent', () => {
  let spectator: Spectator<InstanceGeneralInfoComponent>;

  const createComponent = createComponentFactory({
    component: InstanceGeneralInfoComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: demoInstance,
      },
    });
  });

  it('checks card title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('General Info');
  });

  it('renders details in card', () => {
    const chartExtra = spectator.query('mat-card-content').querySelectorAll('p');
    expect(chartExtra).toHaveLength(6);
    expect(chartExtra[0]).toHaveText('Name: Demo');
    expect(chartExtra[1]).toHaveText('Status: Running');
    expect(chartExtra[2]).toHaveText('Autostart: Yes');
    expect(chartExtra[3]).toHaveText('Base Image: Almalinux 8 amd64 (20241030_23:38)');
    expect(chartExtra[4]).toHaveText('CPU: 525');
    expect(chartExtra[5]).toHaveText('Memory: 125 MiB');
  });
});
