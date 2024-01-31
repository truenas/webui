import { NgModule } from '@angular/core';
import { FileSizePipe } from 'app/modules/ix-file-size/ix-file-size.pipe';

@NgModule({
  declarations: [
    FileSizePipe,
  ],
  exports: [
    FileSizePipe,
  ],
})
export class IxFileSizeModule { }
