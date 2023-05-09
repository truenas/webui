import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
// eslint-disable-next-line no-restricted-imports
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxIconRegistry } from 'app/modules/ix-icon/ix-icon.service';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
  ],
  declarations: [IxIconComponent],
  exports: [IxIconComponent],
  providers: [{
    provide: MatIconRegistry,
    useClass: IxIconRegistry,
  }],
})
export class IxIconModule {}
