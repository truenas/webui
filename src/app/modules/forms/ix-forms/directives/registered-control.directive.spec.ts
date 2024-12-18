import { ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator/jest';
import { RegisteredControlDirective } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

// TODO: https://ixsystems.atlassian.net/browse/NAS-133118
describe.skip('RegisteredControlDirective', () => {
  let spectator: SpectatorDirective<RegisteredControlDirective>;

  const createDirective = createDirectiveFactory({
    directive: RegisteredControlDirective,
    providers: [
      mockProvider(IxFormService),
      mockProvider(NgControl, {}),
    ],
  });

  beforeEach(() => {
    spectator = createDirective('<div ixRegisteredControl [label]="\'Test\'" [formGroupName]=\'test\'></div>');
  });

  it('registers control and element ref of the element with form service', () => {
    expect(spectator.inject(IxFormService).registerControl).toHaveBeenCalledWith(
      spectator.inject(NgControl),
      expect.any(ElementRef),
    );
  });
});
