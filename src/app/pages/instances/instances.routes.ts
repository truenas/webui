import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllInstancesComponent } from 'app/pages/instances/components/all-instances/all-instances.component';
import {
  InstanceConsoleComponent,
} from 'app/pages/instances/components/instance-shell/instance-console.component';
import { InstanceShellComponent } from 'app/pages/instances/components/instance-shell/instance-shell.component';
import { InstanceWizardComponent } from 'app/pages/instances/components/instance-wizard/instance-wizard.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

export const instancesRoutes: Routes = [{
  path: '',
  data: { title: T('Instances'), breadcrumb: null },
  providers: [
    VirtualizationConfigStore,
    VirtualizationInstancesStore,
    VirtualizationDevicesStore,
  ],
  children: [
    {
      path: '',
      component: AllInstancesComponent,
    },
    {
      path: 'new',
      component: InstanceWizardComponent,
      data: { title: T('Add Instances') },
    },
    {
      path: 'view/:id',
      data: { title: T('Instances'), breadcrumb: null },
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: AllInstancesComponent,
        },
        {
          path: 'shell',
          component: InstanceShellComponent,
          data: { title: T('Instance Shell') },
        },
        {
          path: 'console',
          component: InstanceConsoleComponent,
          data: { title: T('Instance Console') },
        },
      ],
    },
  ],
}];
