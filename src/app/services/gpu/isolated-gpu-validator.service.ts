import { Injectable, inject } from '@angular/core';
import {
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { GpuService } from 'app/services/gpu/gpu.service';

@Injectable({
  providedIn: 'root',
})
export class IsolatedGpuValidatorService {
  private translate = inject(TranslateService);
  private gpuService = inject(GpuService);
  private validatorsService = inject(IxValidatorsService);


  validateGpu = (control: AbstractControl): Observable<ValidationErrors | null> => {
    return this.gpuService.getAllGpus().pipe(
      switchMap((allGpus) => {
        const selectedGpus = (control.value || []) as string[];

        if (!selectedGpus.length) {
          return of(null);
        }

        if (selectedGpus.length < allGpus.length) {
          return of(null);
        }

        return this.makeErrorMessage();
      }),
    );
  };

  private makeErrorMessage(): Observable<ValidationErrors> {
    return this.gpuService.getIsolatedGpus().pipe(
      map((isolatedGpus) => {
        // Plain text only — the message is rendered as text (tn-form-field subscript), not HTML.
        const messageParts = [
          this.translate.instant('At least 1 GPU is required by the host for its functions.'),
        ];

        if (isolatedGpus.length) {
          messageParts.push(this.translate.instant(
            'Currently isolated GPU(s): {gpus}.',
            { gpus: isolatedGpus.map((gpu) => gpu.description).join(', ') },
          ));
        }

        messageParts.push(this.translate.instant('With your selection, no GPU is available for the host to consume.'));
        return this.validatorsService.makeErrorMessage('gpus', messageParts.join(' '));
      }),
    );
  }
}
