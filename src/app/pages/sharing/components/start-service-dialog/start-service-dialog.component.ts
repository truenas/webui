import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, forkJoin } from 'rxjs';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { waitForServices } from 'app/store/services/services.selectors';

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
  startAutomaticallyControl = new FormControl(false);
  private services: Service[] = [];

  get service(): Service {
    return this.services.find((service) => service.service === this.serviceName);
  }

  get serviceHumanName(): string {
    return serviceNames.get(this.serviceName);
  }

  get isRestartRequired(): boolean {
    return this.service.state !== ServiceStatus.Stopped;
  }

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<StartServiceDialogComponent, boolean>,
    private store$: Store<ServicesState>,
    @Inject(MAT_DIALOG_DATA) public serviceName: ServiceName,
  ) {}

  ngOnInit(): void {
    this.getServices();
  }

  getServices(): void {
    this.store$
      .pipe(waitForServices, untilDestroyed(this))
      .subscribe((services) => {
        this.services = services;
        if (this.service.state !== ServiceStatus.Running) {
          this.dialogRef.close(true);
        }
      });
  }

  onSubmit(): void {
    const requests: Observable<unknown>[] = [];
    const result: StartServiceDialogResult = {
      start: true,
      startAutomatically: this.startAutomaticallyControl.value,
    };

    if (result.start && result.startAutomatically) {
      requests.push(this.ws.call('service.update', [this.service.id, { enable: result.startAutomatically } ]));
    }

    if (result.start) {
      requests.push(this.ws.call('service.start', [this.serviceName, { silent: false }]));
    }

    const request$ = requests.length ? forkJoin(requests) : of(requests);

    request$
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(
            this.translate.instant('The {service} service has started.', { service: this.serviceHumanName }),
          );
          this.dialogRef.close(true);
        },
        error: () => {
          this.dialogRef.close(false);
        },
      });
  }
}
