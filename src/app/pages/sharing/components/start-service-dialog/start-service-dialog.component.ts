import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, forkJoin } from 'rxjs';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

export interface StartServiceDialogResult {
  start: boolean;
  startAutomatically: boolean;
}

@UntilDestroy()
@Component({
  templateUrl: './start-service-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartServiceDialogComponent implements OnInit {
  startAutomaticallyControl = new FormControl(true);
  private service: Service;

  get serviceHumanName(): string {
    return serviceNames.get(this.serviceName);
  }

  get isStopped(): boolean {
    return this.service.state === ServiceStatus.Stopped;
  }

  get isDisabled(): boolean {
    return !this.service.enable;
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<StartServiceDialogComponent, StartServiceDialogResult>,
    private store$: Store<ServicesState>,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) public serviceName: ServiceName,
  ) {}

  ngOnInit(): void {
    this.store$.select(selectService(this.serviceName))
      .pipe(untilDestroyed(this))
      .subscribe((service) => {
        this.service = service;
        this.cdr.markForCheck();
      });
  }

  onCancel(): void {
    this.dialogRef.close({
      start: false,
      startAutomatically: false,
    });
  }

  onSubmit(): void {
    const requests: Observable<boolean | number>[] = [];
    const result: StartServiceDialogResult = {
      start: true,
      startAutomatically: this.startAutomaticallyControl.value,
    };

    if (result.start && result.startAutomatically && this.isDisabled) {
      requests.push(this.ws.call('service.update', [this.service.id, { enable: result.startAutomatically } ]));
    }

    if (result.start) {
      requests.push(this.ws.call('service.start', [this.serviceName, { silent: false }]));
    }

    forkJoin(requests)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          if (result.startAutomatically) {
            this.snackbar.success(
              this.translate.instant(
                'The {service} service is running and will auto-start after a system reboot.',
                { service: this.serviceHumanName },
              ),
            );
          } else {
            this.snackbar.success(
              this.translate.instant('The {service} service is running.', { service: this.serviceHumanName }),
            );
          }
          this.dialogRef.close(result);
        },
        error: (error: WebsocketError) => {
          this.dialogRef.close({
            start: false,
            startAutomatically: false,
          });
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
