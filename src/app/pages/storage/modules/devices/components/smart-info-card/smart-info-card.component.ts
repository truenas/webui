import { DecimalPipe, AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnChanges,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { uniqBy } from 'lodash-es';
import {
  Observable,
} from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { Disk } from 'app/interfaces/disk.interface';
import { SmartTestResult } from 'app/interfaces/smart-test.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ManualTestDialogComponent, ManualTestDialogParams,
} from 'app/pages/storage/modules/disks/components/manual-test-dialog/manual-test-dialog.component';

@UntilDestroy()
@Component({
  selector: 'ix-smart-info-card',
  templateUrl: './smart-info-card.component.html',
  styleUrls: ['./smart-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    WithLoadingStateDirective,
    RouterLink,
    TranslateModule,
    DecimalPipe,
    AsyncPipe,
  ],
})
export class SmartInfoCardComponent implements OnChanges {
  readonly topologyDisk = input.required<TopologyDisk>();
  readonly disk = input<Disk>();
  hasSmartTestSupport = input(false);

  protected readonly requiredRoles = [Role.DiskWrite];

  totalResults$: Observable<LoadingState<number>>;
  lastResultsInCategory$: Observable<SmartTestResult[]>;
  smartTasksCount$: Observable<LoadingState<number>>;

  readonly SmartTestResultPageType = SmartTestResultPageType;

  readonly tasksMessage = T('{n, plural, =0 {No Tasks} one {# Task} other {# Tasks}} Configured');

  private readonly maxResultCategories = 4;

  constructor(
    private api: ApiService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.loadTestResults();
    this.loadSmartTasks();
  }

  onManualTest(): void {
    const disk = this.disk();
    const testDialog = this.matDialog.open(ManualTestDialogComponent, {
      data: {
        selectedDisks: [disk],
        diskIdsWithSmart: [disk.identifier],
      } as ManualTestDialogParams,
      width: '600px',
    });
    testDialog
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.loadTestResults();
      });
  }

  private loadTestResults(): void {
    const results$ = this.api.call('smart.test.results', [[['disk', '=', this.topologyDisk().disk]]]).pipe(
      map((testResults) => {
        const results = testResults[0]?.tests ?? [];
        return results.filter((result) => result.status !== SmartTestResultStatus.Running);
      }),
    );

    this.totalResults$ = results$.pipe(
      map((results) => results.length),
      toLoadingState(),
    );

    this.lastResultsInCategory$ = results$.pipe(
      map((results) => {
        const normalizedResults = results.map((result) => ({
          ...result,
          description: this.normalizeDescription(result.description),
        }));
        const lastResultsInCategories = uniqBy(normalizedResults, (result) => result.description);
        return lastResultsInCategories.slice(0, this.maxResultCategories);
      }),
    );
    this.cdr.markForCheck();
  }

  private loadSmartTasks(): void {
    this.smartTasksCount$ = this.api.call('smart.test.query_for_disk', [this.topologyDisk().disk]).pipe(
      map((tasks) => tasks.length),
      toLoadingState(),
    );
  }

  private normalizeDescription(description: string): string {
    if (description.toLowerCase().includes('short')) {
      return this.translate.instant('Short');
    }
    if (description.toLowerCase().includes('long')) {
      return this.translate.instant('Long');
    }

    return description;
  }
}
