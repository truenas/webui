import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ValueAccessorParent } from 'app/pages/system/general-settings/localization-form2/components/value-accessor-parent.class';

@Component({
  selector: 'ix-input',
  templateUrl: 'ix-input.component.html',
  styleUrls: ['./ix-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IXInputComponent),
      multi: true,
    },
  ],
})
export class IXInputComponent extends ValueAccessorParent {}
