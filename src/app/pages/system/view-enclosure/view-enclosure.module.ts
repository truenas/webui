import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { routing } from 'app/pages/system/system.routing';
import { M50EnclosureComponent } from 'app/pages/system/view-enclosure/components/m50-enclosure/m50-enclosure.component';

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
