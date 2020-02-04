import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import { TranslateModule } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';

import { JailService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';

import { routing } from './jails.routing';
import { JailListComponent } from './jail-list/';
import { JailFormComponent } from './jail-form/jail-form.component';
import { StorageListComponent } from './storages/storage-list/';
import { StorageFormComponent } from './storages/storage-form/';
import { JailWizardComponent } from './jail-wizard/';
import { JailShellComponent } from './jail-shell/';

@NgModule({
  imports : [
    CommonModule, FormsModule, ReactiveFormsModule, routing, EntityModule, MaterialModule, TranslateModule, FlexLayoutModule
  ],
  declarations : [
    JailListComponent,
    JailFormComponent,
    StorageListComponent,
    StorageFormComponent,
    JailWizardComponent,
    JailShellComponent
  ],
  providers : [
    JailService,
  ]
})
export class JailsModule {
}