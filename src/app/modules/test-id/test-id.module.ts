import { NgModule } from '@angular/core';
import { TestDirective } from 'app/modules/test-id/test/test.directive';

@NgModule({
  declarations: [
    TestDirective,
  ],
  exports: [
    TestDirective,
  ],
})
export class TestIdModule {}
