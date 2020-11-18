import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../appMaterial.module';
import { FlexLayoutModule } from '@angular/flex-layout';

import { ApplicationsComponent } from './applications.component';
import { ApplicationsRoutingModule } from './applications-routing.module';


@NgModule({
  imports: [
    CommonModule,
    ApplicationsRoutingModule,
    MaterialModule,
    FlexLayoutModule
  ],
  declarations: [
    ApplicationsComponent
  ]
})
export class ApplicationsModule { }
