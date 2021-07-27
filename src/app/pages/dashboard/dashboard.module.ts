import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'app/app-material.module';
import { AppCommonModule } from 'app/components/common/app-common.module';
import { CoreComponents } from 'app/core/components/core-components.module';
import { EntityModule } from '../common/entity/entity.module';
import { DashboardComponent } from './dashboard.component';
import { routing } from './dashboard.routing';

@NgModule({
  imports: [CoreComponents, CommonModule, FormsModule, routing,
    MaterialModule, AppCommonModule, EntityModule],
  declarations: [
    DashboardComponent,
  ],
  providers: [

  ],
})
export class DashboardModule {
}
