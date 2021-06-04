import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { MaterialModule } from 'app/appMaterial.module';

import { JailService } from 'app/services';

import { EntityModule } from '../common/entity/entity.module';

import { JailFormComponent } from './jail-form/jail-form.component';
import { JailListComponent } from './jail-list';
import { JailShellComponent } from './jail-shell';
import { JailWizardComponent } from './jail-wizard';
import { routing } from './jails.routing';
import { StorageFormComponent } from './storages/storage-form';
import { StorageListComponent } from './storages/storage-list';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, routing, EntityModule, MaterialModule, TranslateModule, FlexLayoutModule,
  ],
  declarations: [
    JailListComponent,
    JailFormComponent,
    StorageListComponent,
    StorageFormComponent,
    JailWizardComponent,
    JailShellComponent,
  ],
  providers: [
    JailService,
  ],
})
export class JailsModule {
}
