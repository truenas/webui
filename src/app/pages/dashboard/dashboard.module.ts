import { AppCommonModule } from '../../components/common/app-common.module';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import { MaterialModule } from '../../appMaterial.module';
import { EntityModule } from '../common/entity/entity.module';
import { CoreComponents } from 'app/core/components/corecomponents.module';

import {DashboardComponent} from './dashboard.component';
import {routing} from './dashboard.routing';
import { DashboardNoteEditComponent } from './dashboard-note-edit.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports : [ CoreComponents, CommonModule, FormsModule,  routing, 
  MaterialModule, AppCommonModule , EntityModule, TranslateModule],
  declarations : [
    DashboardComponent,
    DashboardNoteEditComponent
  ],
  providers : [
    
  ]
})
export class DashboardModule {
}
