import { ElementRef } from '@angular/core';
import {
  ReactiveFormsModule, FormGroup, FormControl, NgControl,
} from '@angular/forms';
import { createDirectiveFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { RegisteredControlDirective } from './registered-control.directive';

describe('RegisteredControlDirective', () => {
  function getGroupDiv(): HTMLDivElement {
    const divElement = document.createElement('div');
    divElement.setAttribute('ixRegisteredControl', '');
    divElement.setAttribute('ix-label', 'Test Group');
    divElement.setAttribute('ng-reflect-form-group-name', 'testGroup');
    divElement.setAttribute('ng-reflect-label', 'Test Group');
    divElement.setAttribute('ng-reflect-label', 'Test Group');
    divElement.setAttribute('ng-reflect-name', 'testGroup');
    divElement.classList.add('ng-untouched');
    divElement.classList.add('ng-pristine');
    divElement.classList.add('ng-valid');
    const inputElement = document.createElement('input');
    inputElement.classList.add('ng-untouched');
    inputElement.setAttribute('ng-reflect-name', 'testControl');
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
    imports: [ReactiveFormsModule, MockComponent(IxFormSectionComponent)],
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

  it('registers control and form section available', () => {
    const spectator = createDirective(`
      <div [formGroup]="fg"><ix-form-section [label]="'Test Section'"><div ixRegisteredControl [label]="'Test Group'" [formGroupName]="'testGroup'"><input formControlName="testControl"></div></ix-form-section></div>
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
    const ixFormSection = document.createElement('ix-form-section');
    ixFormSection.setAttribute('id', 'Test Section');
    expect(formService.registerSectionControl).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'testGroup', control: testGroup }),
      expect.objectContaining({
        label: 'Test Section',
      }),
    );
    spectator.directive.ngOnDestroy();
    expect(formService.unregisterControl).toHaveBeenCalledWith('testGroup');
    expect(formService.unregisterSectionControl).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Test Section',
      }),
      expect.objectContaining({ name: 'testGroup', control: testGroup }),
    );
  });
});
