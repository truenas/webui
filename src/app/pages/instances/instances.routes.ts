import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UnsavedFormGuard } from 'app/modules/unsaved-changes/unsaved-form.guard';
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
  data: { title: T('Containers'), breadcrumb: null },
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
      canDeactivate: [UnsavedFormGuard],
      data: { title: T('Add Containers') },
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
