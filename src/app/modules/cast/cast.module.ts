import { NgModule } from '@angular/core';
import { CastPipe } from 'app/modules/cast/cast.pipe';

/**
 * TODO: This should really be in core or common module once core module is cleaned up.
 */
@NgModule({
  declarations: [
    CastPipe,
  ],
  exports: [
    CastPipe,
  ],
})
export class CastModule {}
