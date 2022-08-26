import { UntypedFormArray } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

export class CustomUntypedFormArray extends UntypedFormArray {
  hidden$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
}
