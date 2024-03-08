import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, forkJoin, of, pairwise,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { helptextSystemUpdate } from 'app/helptext/system/update';
import { Option } from 'app/interfaces/option.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { AuthService } from 'app/services/auth/auth.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-train-card',
  styleUrls: ['train-card.component.scss'],
  templateUrl: './train-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  protected readonly requiresRoles = [Role.FullAdmin];
  protected readonly clickForInformationLink = helptextSystemUpdate.clickForInformationLink;
  protected readonly SystemUpdateStatus = SystemUpdateStatus;

  constructor(
    private sysGenService: SystemGeneralService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private fb: FormBuilder,
    private authService: AuthService,
    protected trainService: TrainService,
    protected updateService: UpdateService,
    private cdr: ChangeDetectorRef,
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
        this.trainService.autoCheckValue$.next(isAutoDownloadOn);
        this.checkable = true;
        this.cdr.markForCheck();
        this.trainService.fullTrainList$.next(trains.trains);

        this.trainService.trainValue$.next(trains.selected || '');
        this.trainService.selectedTrain$.next(trains.selected);

        if (isAutoDownloadOn) {
          this.trainService.check();
        }

        this.trains = Object.entries(trains.trains).map(([name, train]) => ({
          label: `${name} - ${train.description}`,
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
      error: (error: WebSocketError) => {
        this.dialogService.warn(
          error.trace.class,
          this.translate.instant('TrueNAS was unable to reach update servers.'),
        );
      },
    });

    this.trainService.trainValue$.pipe(untilDestroyed(this)).subscribe((trainValue) => {
      this.form.controls.train.patchValue(trainValue);
    });

    this.trainService.autoCheckValue$.pipe(untilDestroyed(this)).subscribe((autoCheckValue) => {
      this.form.controls.auto_check.patchValue(autoCheckValue);
    });

    this.form.controls.train.valueChanges.pipe(pairwise(), untilDestroyed(this)).subscribe(([prevTrain, newTrain]) => {
      this.trainService.onTrainChanged(newTrain, prevTrain);
    });

    this.form.controls.auto_check.valueChanges.pipe(
      filterAsync(this.authService.hasRole(Role.FullAdmin)),
      untilDestroyed(this),
    ).subscribe(() => {
      this.trainService.toggleAutoCheck();
    });
  }
}
