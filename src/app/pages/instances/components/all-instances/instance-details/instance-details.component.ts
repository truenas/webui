import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { instanceDetailsElements } from 'app/pages/instances/components/all-instances/instance-details/instance-details.elements';
import {
  InstanceDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-devices/instance-devices.component';
import {
  InstanceDisksComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import { InstanceIdmapComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-idmap/instance-idmap.component';
import { InstanceMetricsComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-metrics/instance-metrics.component';
import { InstanceNicsComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-nics/instance-nics.component';
import {
  InstanceProxiesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-proxies/instance-proxies.component';
import {
  InstanceToolsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-tools/instance-tools.component';

@Component({
  selector: 'ix-instance-details',
  templateUrl: './instance-details.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    InstanceDevicesComponent,
    InstanceGeneralInfoComponent,
    InstanceProxiesComponent,
    InstanceDisksComponent,
    InstanceToolsComponent,
    InstanceMetricsComponent,
    InstanceNicsComponent,
    UiSearchDirective,
    InstanceIdmapComponent,
  ],
})
export class InstanceDetailsComponent {
  instance = input.required<VirtualizationInstance>();

  protected readonly searchableElements = instanceDetailsElements;
  protected readonly VirtualizationType = VirtualizationType;

  protected readonly isContainer = computed(() => {
    return this.instance().type === VirtualizationType.Container;
  });
}
