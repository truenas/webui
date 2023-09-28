import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
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
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  templateUrl: './start-service-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartServiceDialogComponent implements OnInit {
  startAutomaticallyControl = new FormControl(false);
  private service: Service;

  get serviceHumanName(): string {
    return serviceNames.get(this.serviceName);
  }

  get isRestartRequired(): boolean {
    return this.service.state !== ServiceStatus.Stopped;
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<StartServiceDialogComponent, boolean>,
    private store$: Store<ServicesState>,
    @Inject(MAT_DIALOG_DATA) public serviceName: ServiceName,
  ) {}

  ngOnInit(): void {
    this.store$.select(selectService(this.serviceName)).pipe(untilDestroyed(this)).subscribe((service) => {
      this.service = service;
      this.cdr.markForCheck();
    });
  }

  onSubmit(): void {
    const requests: Observable<unknown>[] = [];
    const startAutomatically = this.startAutomaticallyControl.value;

    if (startAutomatically) {
      requests.push(this.ws.call('service.update', [this.service.id, { enable: this.startAutomaticallyControl.value } ]));
    }

    requests.push(this.ws.call('service.start', [this.serviceName, { silent: false }]));

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
