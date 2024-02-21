import { NgModule } from '@angular/core';
import { IxFileSizePipe } from 'app/modules/ix-file-size/ix-file-size.pipe';

@NgModule({
  declarations: [
    IxFileSizePipe,
  ],
  exports: [
    IxFileSizePipe,
  ],
})
export class IxFileSizeModule { }
