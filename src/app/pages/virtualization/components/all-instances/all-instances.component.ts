import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  AllInstancesHeaderComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/all-instances-header.component';
import {
  InstanceDetailsComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-details.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';

@Component({
  selector: 'ix-instance-list',
  templateUrl: './all-instances.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslateModule,
    AllInstancesHeaderComponent,
    InstanceDetailsComponent,
  ],
})
export class AllInstancesComponent implements OnInit {
  constructor(
    private configStore: VirtualizationConfigStore,
  ) {}

  ngOnInit(): void {
    this.configStore.initialize();
  }
}
