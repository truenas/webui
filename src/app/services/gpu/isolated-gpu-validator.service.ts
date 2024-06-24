import { Injectable } from '@angular/core';
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
  constructor(
    private translate: TranslateService,
    private gpuService: GpuService,
    private validatorsService: IxValidatorsService,
  ) { }

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
        let errorMessage = this.translate.instant('At least 1 GPU is required by the host for its functions.');

        if (isolatedGpus.length) {
          const gpuListItems = isolatedGpus.map((gpu, index) => `${index + 1}. ${gpu.description}`);
          const listItems = '<li>' + gpuListItems.join('</li><li>') + '</li>';
          errorMessage += this.translate.instant(
            '<p>Currently following GPU(s) have been isolated:<ol>{gpus}</ol></p>',
            { gpus: listItems },
          );
        }

        errorMessage += `<p>${this.translate.instant('With your selection, no GPU is available for the host to consume.')}</p>`;
        return this.validatorsService.makeErrorMessage('gpus', errorMessage);
      }),
    );
  }
}
