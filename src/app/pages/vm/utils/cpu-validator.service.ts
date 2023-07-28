import { Injectable } from '@angular/core';
import {
  AbstractControl, FormGroup, ValidationErrors,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import {
  catchError, map, shareReplay,
} from 'rxjs/operators';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services/ws.service';

/**
 * An async validator.
 * Expects `vcpus`, `cores` and `threads` fields to be present in parent form.
 */
@Injectable()
export class CpuValidatorService {
  private maximumCpus$: Observable<number>;

  constructor(
    private validators: IxValidatorsService,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  createValidator(): (control: AbstractControl) => Observable<ValidationErrors | null> {
    const maximumCpus$ = this.getMaxVcpus();

    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return maximumCpus$.pipe(
        map((maxVcpus) => {
          const form = control.parent as FormGroup;
          const vcpus = form.controls.vcpus.value as number;
          const cores = form.controls.cores.value as number;
          const threads = form.controls.threads.value as number;

          const hasError = vcpus * cores * threads > maxVcpus;
          if (!hasError) {
            return null;
          }

          return this.validators.makeErrorMessage(
            'invalidCpus',
            this.translate.instant(helptext.vcpus_warning, { maxVcpus }),
          );
        }),
        catchError(() => of(null)),
      );
    };
  }

  /**
   * Start loading maxVcpus immediately
   */
  private getMaxVcpus(): Observable<number> {
    if (!this.maximumCpus$) {
      this.maximumCpus$ = this.ws.call('vm.maximum_supported_vcpus').pipe(shareReplay({
        refCount: false,
        bufferSize: 1,
      }));
    }

    return this.maximumCpus$;
  }
}
