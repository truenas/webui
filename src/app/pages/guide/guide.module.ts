// Common Modules
import { NgModule } from '@angular/core';
import { MaterialModule } from 'app/appMaterial.module';
// Component Modules
import { GuideComponent } from './guide.component';
import { routing } from './guide.routing';

@NgModule({
  imports: [routing, MaterialModule],
  declarations: [
    GuideComponent,
  ],
  providers: [],
})
export class GuideModule {}
