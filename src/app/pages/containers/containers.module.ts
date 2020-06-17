import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import { NgxDualListboxModule } from '../../components/common/dual-list/dual-list.module';
import { TranslateModule } from '@ngx-translate/core';
import { EntityModule } from '../common/entity/entity.module';

import { routing } from './containers.routing';
import { ContainersComingsoonComponent } from './containers-comingsoon/containers-comingsoon.component';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule, MaterialModule, NgxDualListboxModule,
    ReactiveFormsModule, routing, TranslateModule
  ],
  declarations: [
    ContainersComingsoonComponent,
  ],
  providers: [
  ]
})
export class ContainersModule {}
