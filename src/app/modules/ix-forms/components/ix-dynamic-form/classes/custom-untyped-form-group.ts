import { UntypedFormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

export class CustomUntypedFormGroup extends UntypedFormGroup {
  hidden$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
}
