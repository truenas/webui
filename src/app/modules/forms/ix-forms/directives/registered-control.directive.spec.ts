import { ElementRef } from '@angular/core';
import {
  ReactiveFormsModule, FormGroup, FormControl, NgControl,
} from '@angular/forms';
import { createDirectiveFactory, mockProvider } from '@ngneat/spectator/jest';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { RegisteredControlDirective } from './registered-control.directive';

describe('RegisteredControlDirective', () => {
  function getGroupDiv(): HTMLDivElement {
    const divElement = document.createElement('div');
    divElement.setAttribute('ixRegisteredControl', '');
    divElement.setAttribute('ix-label', 'Test Group');
    divElement.classList.add('ng-untouched');
    divElement.classList.add('ng-pristine');
    divElement.classList.add('ng-valid');
    const inputElement = document.createElement('input');
    inputElement.classList.add('ng-untouched');
    inputElement.classList.add('ng-pristine');
    inputElement.classList.add('ng-valid');
    inputElement.setAttribute('formControlName', 'testControl');
    divElement.appendChild(inputElement);
    return divElement;
  }
  const testGroup = new FormGroup({
    testControl: new FormControl(''),
  });
  const createDirective = createDirectiveFactory({
    directive: RegisteredControlDirective,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(NgControl, {
        name: 'testGroup',
        control: testGroup,
      }),
      mockProvider(IxFormService),
    ],
  });

  it('registers control when control name is available', () => {
    const spectator = createDirective(`
      <div [formGroup]="fg"><div ixRegisteredControl [label]="'Test Group'" [formGroupName]="'testGroup'"><input formControlName="testControl"></div></div>
    `, {
      hostProps: {
        fg: new FormGroup({
          testGroup,
        }),
      },
    });

    expect(spectator.inject(IxFormService).registerControl).toHaveBeenCalled();
  });

  it('registers the control element under its name and unregisters it on destroy', () => {
    const spectator = createDirective(`
      <div [formGroup]="fg"><div ixRegisteredControl [label]="'Test Group'" [formGroupName]="'testGroup'"><input formControlName="testControl"></div></div>
    `, {
      hostProps: {
        fg: new FormGroup({
          testGroup,
        }),
      },
    });
    const formService = spectator.inject(IxFormService);
    expect(
      formService.registerControl,
    ).toHaveBeenCalledWith('testGroup', new ElementRef(getGroupDiv()));

    spectator.directive.ngOnDestroy();
    expect(formService.unregisterControl).toHaveBeenCalledWith('testGroup');
  });
});
