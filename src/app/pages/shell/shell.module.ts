//Common Modules
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import { EntityModule } from '../common/entity/entity.module';
//Component Modules
import { ShellComponent } from './shell.component';
import { routing } from './shell.routing';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/components/corecomponents.module';

@NgModule({
  imports: [CommonModule, FormsModule, EntityModule, routing, MaterialModule, TranslateModule, CoreComponents],
  declarations: [ShellComponent]
})
export class ShellModule {}
