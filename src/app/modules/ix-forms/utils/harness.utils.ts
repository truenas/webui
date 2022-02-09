import { ComponentHarness } from '@angular/cdk/testing';

export async function getErrorText(this: ComponentHarness): Promise<string> {
  const errors = await this.locatorForOptional('ix-errors')();
  return errors ? errors.text() : '';
}
