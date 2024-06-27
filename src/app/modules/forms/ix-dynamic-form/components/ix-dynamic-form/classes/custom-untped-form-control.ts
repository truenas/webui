import { UntypedFormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

export class CustomUntypedFormControl extends UntypedFormControl {
  hidden$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
}
