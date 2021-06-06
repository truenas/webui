// Common Modules
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from '../common/entity/entity.module';
// Component Modules
import { ShellComponent } from './shell.component';
import { routing } from './shell.routing';

@NgModule({
  imports: [CommonModule, FormsModule, EntityModule, routing, MaterialModule, TranslateModule, CoreComponents, CommonDirectivesModule],
  declarations: [ShellComponent],
})
export class ShellModule {}
