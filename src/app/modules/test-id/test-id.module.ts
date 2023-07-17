import { NgModule } from '@angular/core';
import { TestDirective } from 'app/modules/test-id/test/test.directive';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';

@NgModule({
  declarations: [
    TestDirective,
    TestOverrideDirective,
  ],
  exports: [
    TestDirective,
    TestOverrideDirective,
  ],
})
export class TestIdModule {}
