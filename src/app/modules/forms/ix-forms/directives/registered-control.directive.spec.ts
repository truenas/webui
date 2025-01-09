import { ElementRef } from '@angular/core';
import {
  ReactiveFormsModule, FormGroup, FormControl, NgControl,
} from '@angular/forms';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { RegisteredControlDirective } from './registered-control.directive';

describe('RegisteredControlDirective', () => {
  const testGroup = new FormGroup({
    testControl: new FormControl(''),
  });
  const createDirective = createHostFactory({
    component: RegisteredControlDirective,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(IxFormService),
      mockProvider(NgControl, {
        name: 'testGroup',
        control: testGroup,
      }),
      mockProvider(ElementRef, {
        nativeElement: document.createElement('div'),
      }),
    ],
  });

  it('shows element when hasAccess is true', () => {
    const spectator = createDirective(`
      <div [formGroup]="fg"><div ixRegisteredControl [formGroupName]="'testGroup'"><input formControlName="testControl"></div></div>
    `, {
      hostProps: {
        fg: new FormGroup({
          testGroup,
        }),
      },
    });

    spectator.component.ngAfterViewInit();

    expect(spectator.inject(IxFormService).registerControl).toHaveBeenCalled();
  });
});
