//Common Modules
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import {EntityModule} from '../common/entity/entity.module';
//Component Modules
import { SystemProcessesComponent } from './system-processes.component';
import { routing } from './system-processes.routing';

@NgModule({
  imports: [CommonModule, FormsModule, EntityModule, routing, MaterialModule],
  declarations: [
    SystemProcessesComponent
  ],
  providers: []
})
export class SystemProcessesModule {}
