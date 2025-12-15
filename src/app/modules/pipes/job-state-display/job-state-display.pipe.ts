import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';

/**
 * Transforms JobState enum values to normalized display text.
 * Normalizes SUCCESS and FINISHED to 'Completed' for consistent UI.
 * Normalizes ERROR and FAILED to 'Failed' for consistent UI.
 */
@Pipe({
  name: 'jobStateDisplay',
  standalone: true,
})
export class JobStateDisplayPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(state: JobState | null | undefined): string {
    if (!state) {
      return '';
    }

    // Normalize SUCCESS and FINISHED to 'Completed'
    if (state === JobState.Success || state === JobState.Finished) {
      return this.translate.instant('Completed');
    }

    // Normalize ERROR and FAILED to 'Failed'
    if (state === JobState.Error || state === JobState.Failed) {
      return this.translate.instant('Failed');
    }

    // For other states, apply titlecase via translation
    const titleCased = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
    return this.translate.instant(titleCased);
  }
}
