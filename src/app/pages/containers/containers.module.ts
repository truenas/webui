import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/appMaterial.module';
import { NgxDualListboxModule } from 'app/components/common/dual-list/dual-list.module';
import { EntityModule } from '../common/entity/entity.module';
import { ContainersComingsoonComponent } from './containers-comingsoon/containers-comingsoon.component';
import { routing } from './containers.routing';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule, MaterialModule, NgxDualListboxModule,
    ReactiveFormsModule, routing, TranslateModule,
  ],
  declarations: [
    ContainersComingsoonComponent,
  ],
  providers: [
  ],
})
export class ContainersModule {}
