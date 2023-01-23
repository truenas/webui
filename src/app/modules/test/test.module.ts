import { NgModule } from '@angular/core';
import { TestDirective } from 'app/modules/test/test/test.directive';

@NgModule({
  declarations: [
    TestDirective,
  ],
  exports: [
    TestDirective,
  ],
})
export class TestModule {}
