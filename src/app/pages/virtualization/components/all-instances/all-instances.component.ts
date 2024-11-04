import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
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
  styleUrls: ['./all-instances.component.scss'],
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
  readonly demoInstance = {
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

  constructor(
    private configStore: VirtualizationConfigStore,
  ) {}

  ngOnInit(): void {
    this.configStore.initialize();
  }
}
