import { Type } from '@angular/core';
import { IxModalData } from 'app/pages/common/ix/components/ix-modal/ix-modal.interface';

export class IxModal {
  constructor(public component: Type<any>, public data: IxModalData) {}
}
