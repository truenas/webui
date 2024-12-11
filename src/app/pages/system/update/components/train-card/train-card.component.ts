import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatMiniFabButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, forkJoin, of, pairwise,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { helptextSystemUpdate } from 'app/helptext/system/update';
import { Option } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-train-card',
  styleUrls: ['train-card.component.scss'],
  templateUrl: './train-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatProgressSpinner,
    ReactiveFormsModule,
    RequiresRolesDirective,
    IxCheckboxComponent,
    IxSelectComponent,
    MatMiniFabButton,
    MatTooltip,
    TestDirective,
    IxIconComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class TrainCardComponent implements OnInit {
  isUpdateRunning = false;
  checkable = false;
  singleDescription: string;
  trains: Option[] = [];

  form = this.fb.group({
    auto_check: [false],
    train: ['', Validators.required],
  });

  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly clickForInformationLink = helptextSystemUpdate.clickForInformationLink;
  protected readonly SystemUpdateStatus = SystemUpdateStatus;

  constructor(
    private sysGenService: SystemGeneralService,
    private translate: TranslateService,
    private fb: FormBuilder,
    private authService: AuthService,
    protected trainService: TrainService,
    protected updateService: UpdateService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) {
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((isUpdating: string) => {
      this.isUpdateRunning = isUpdating === 'true';
      this.cdr.markForCheck();
    });
  }

  get trains$(): Observable<Option[]> {
    return of(this.trains);
  }

  ngOnInit(): void {
    forkJoin([
      this.trainService.getAutoDownload(),
      this.trainService.getTrains(),
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([isAutoDownloadOn, trains]) => {
        this.form.controls.auto_check.patchValue(isAutoDownloadOn);
        this.checkable = true;
        this.cdr.markForCheck();
        this.trainService.fullTrainList$.next(trains.trains);

        this.trainService.trainValue$.next(trains.selected || '');
        this.trainService.selectedTrain$.next(trains.selected);

        if (isAutoDownloadOn) {
          this.trainService.check();
        }

        this.trains = Object.entries(trains.trains).map(([name, train]) => ({
          label: train.description,
          value: name,
        }));
        if (this.trains.length > 0) {
          this.singleDescription = Object.values(trains.trains)[0]?.description;
        }

        let currentTrainDescription = '';

        if (trains.trains[trains.current]) {
          if (trains.trains[trains.current].description.toLowerCase().includes('[nightly]')) {
            currentTrainDescription = '[nightly]';
          } else if (trains.trains[trains.current].description.toLowerCase().includes('[release]')) {
            currentTrainDescription = '[release]';
          } else if (trains.trains[trains.current].description.toLowerCase().includes('[prerelease]')) {
            currentTrainDescription = '[prerelease]';
          } else {
            currentTrainDescription = trains.trains[trains.selected].description.toLowerCase();
          }
        }
        this.trainService.currentTrainDescription$.next(currentTrainDescription);
        // To remember train description if user switches away and then switches back
        this.trainService.trainDescriptionOnPageLoad$.next(currentTrainDescription);

        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });

    this.trainService.trainValue$.pipe(untilDestroyed(this)).subscribe((trainValue) => {
      this.form.controls.train.patchValue(trainValue);
    });

    this.form.controls.train.valueChanges.pipe(pairwise(), untilDestroyed(this)).subscribe(([prevTrain, newTrain]) => {
      this.trainService.onTrainChanged(newTrain, prevTrain);
    });

    this.form.controls.auto_check.valueChanges.pipe(
      filterAsync(() => this.authService.hasRole(Role.FullAdmin)),
      untilDestroyed(this),
    ).subscribe(() => {
      this.trainService.toggleAutoCheck(this.form.controls.auto_check.value);
    });
  }
}
