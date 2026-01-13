import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DisplayableState, JobState } from 'app/enums/job-state.enum';
import { TaskState } from 'app/enums/task-state.enum';

/**
 * Transforms job and task state enum values to normalized display text.
 * Accepts both JobState and TaskState values (DisplayableState union type).
 *
 * Normalizations:
 * - JobState.Success + TaskState.Finished → 'Completed'
 * - JobState.Failed + TaskState.Error → 'Failed'
 * - All other states → Titlecased via translation
 */
@Pipe({
  name: 'jobStateDisplay',
  standalone: true,
})
export class JobStateDisplayPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(state: DisplayableState | null | undefined): string {
    if (!state) {
      return '';
    }

    // Normalize SUCCESS and FINISHED to 'Completed'
    if (state === JobState.Success || state === TaskState.Finished) {
      return this.translate.instant('Completed');
    }

    // Normalize ERROR and FAILED to 'Failed'
    if (state === TaskState.Error || state === JobState.Failed) {
      return this.translate.instant('Failed');
    }

    // For other states, apply titlecase via translation
    const titleCased = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
    return this.translate.instant(titleCased);
  }
}
