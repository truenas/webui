import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'app/appMaterial.module';
import { NgxDualListboxModule } from 'app/components/common/dual-list/dual-list.module';
import { TranslateModule } from '@ngx-translate/core';
import { EntityModule } from '../common/entity/entity.module';

import { routing } from './clustering.routing';
import { ClusteringComingsoonComponent } from './clustering-comingsoon/clustering-comingsoon.component';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule, MaterialModule, NgxDualListboxModule,
    ReactiveFormsModule, routing, TranslateModule,
  ],
  declarations: [
    ClusteringComingsoonComponent,
  ],
  providers: [
  ],
})
export class ClusteringModule {}
