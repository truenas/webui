//Common Modules
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
//Component Modules
import { GuideComponent } from './guide.component';
import { routing } from './guide.routing';

@NgModule({
  imports: [routing, MaterialModule],
  declarations: [
    GuideComponent
  ],
  providers: []
})
export class GuideModule {}
