import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DisplayableState, JobState } from 'app/enums/job-state.enum';
import { TaskState } from 'app/enums/task-state.enum';

/**
 * Display text for a job or task state: Success/Finished → 'Completed', Failed/Error → 'Failed',
 * anything else title-cased via translation. The pipe below wraps this for templates; code without
 * one, like a tn-table column model, calls it directly.
 */
export function formatJobStateValue(
  state: DisplayableState | null | undefined,
  translate: TranslateService,
): string {
  if (!state) {
    return '';
  }

  // Normalize SUCCESS and FINISHED to 'Completed'
  if (state === JobState.Success || state === TaskState.Finished) {
    return translate.instant('Completed');
  }

  // Normalize ERROR and FAILED to 'Failed'
  if (state === TaskState.Error || state === JobState.Failed) {
    return translate.instant('Failed');
  }

  // For other states, apply titlecase via translation
  const titleCased = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  return translate.instant(titleCased);
}

/**
 * Transforms job and task state enum values to normalized display text.
 * Accepts both JobState and TaskState values (DisplayableState union type).
 *
 * See {@link formatJobStateValue} for the normalizations applied.
 */
@Pipe({
  name: 'jobStateDisplay',
  standalone: true,
})
export class JobStateDisplayPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(state: DisplayableState | null | undefined): string {
    return formatJobStateValue(state, this.translate);
  }
}
