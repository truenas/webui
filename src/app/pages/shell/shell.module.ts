//Common Modules
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule, MdCardModule } from '@angular/material';
import { NgaModule } from '../../theme/nga.module';
import {EntityModule} from '../common/entity/entity.module';
//Component Modules
import { ShellComponent } from './shell.component';
import { routing } from './shell.routing';

@NgModule({
  imports: [CommonModule, FormsModule, NgaModule, EntityModule, routing, MaterialModule, MdCardModule],
  declarations: [
    ShellComponent
  ],
  providers: []
})
export class ShellModule {}
