import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  CreateNewInstanceButtonComponent,
} from 'app/pages/virtualization/components/virtualization-dashboard/create-new-instance-button/create-new-instance-button.component';
import {
  GlobalConfigCardComponent,
} from 'app/pages/virtualization/components/virtualization-dashboard/global-config-card/global-config-card.component';
import {
  InstancesStatusCardComponent,
} from 'app/pages/virtualization/components/virtualization-dashboard/instances-status-card/instances-status-card.component';

@Component({
  selector: 'ix-virtualization-dashboard',
  templateUrl: './virtualization-dashboard.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CreateNewInstanceButtonComponent,
    TranslateModule,
    GlobalConfigCardComponent,
    InstancesStatusCardComponent,
  ],
})
export class VirtualizationDashboardComponent {

}
