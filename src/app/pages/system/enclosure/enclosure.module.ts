import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { M50EnclosureComponent } from 'app/pages/system/enclosure/components/m50-enclosure/m50-enclosure.component';
import { routing } from 'app/pages/system/system.routing';

@NgModule({
  imports: [
    routing,
    CommonModule,
  ],
  declarations: [
    M50EnclosureComponent,
  ],

})
export class EnclosureModule {}
