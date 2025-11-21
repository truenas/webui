import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllInstancesComponent } from 'app/pages/instances/components/all-instances/all-instances.component';
import {
  InstanceConsoleComponent,
} from 'app/pages/instances/components/instance-shell/instance-console.component';
import { InstanceShellComponent } from 'app/pages/instances/components/instance-shell/instance-shell.component';
import { ContainerConfigStore } from 'app/pages/instances/stores/container-config.store';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

export const instancesRoutes: Routes = [{
  path: '',
  data: { title: T('Containers'), breadcrumb: null },
  providers: [
    ContainerConfigStore,
    ContainerInstancesStore,
    ContainerDevicesStore,
  ],
  children: [
    {
      path: '',
      component: AllInstancesComponent,
    },
    {
      path: 'view/:id',
      data: { title: T('Containers'), breadcrumb: null },
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: AllInstancesComponent,
        },
        {
          path: 'shell',
          component: InstanceShellComponent,
          data: { title: T('Container Shell') },
        },
        {
          path: 'console',
          component: InstanceConsoleComponent,
          data: { title: T('Container Console') },
        },
      ],
    },
  ],
}];
