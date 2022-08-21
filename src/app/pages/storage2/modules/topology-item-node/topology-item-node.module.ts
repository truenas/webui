import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TopologyItemIconComponent } from 'app/pages/storage2/modules/topology-item-node/topology-item-icon/topology-item-icon.component';
import { TopologyItemNodeComponent } from 'app/pages/storage2/modules/topology-item-node/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage2/modules/topology-item-node/vdev-group-node/vdev-group-node.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    IxIconModule,
  ],
  declarations: [
    TopologyItemNodeComponent,
    TopologyItemIconComponent,
    VDevGroupNodeComponent,
  ],
  exports: [
    TopologyItemNodeComponent,
    TopologyItemIconComponent,
    VDevGroupNodeComponent,
  ],
})
export class TopologyItemNodeModule { }
