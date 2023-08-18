import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  EMPTY, forkJoin, Observable, of,
} from 'rxjs';
import {
  catchError, filter, map, switchMap, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/apps/apps';
import { KubernetesConfig, KubernetesConfigUpdate } from 'app/interfaces/kubernetes-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import {
  DialogService,
} from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './kubernetes-settings.component.html',
  styleUrls: ['./kubernetes-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KubernetesSettingsComponent implements OnInit {
  isFormLoading = false;

  readonly form = this.fb.group({
    node_ip: [''],
    route_v4_interface: [''],
    route_v4_gateway: [''],
    enable_container_image_update: [true],
    configure_gpus: [true],
    servicelb: [true],
    cluster_cidr: ['', Validators.required],
    service_cidr: ['', Validators.required],
    cluster_dns_ip: ['', Validators.required],
    force: [false],
  });

  readonly reInitHelpText = helptext.kubForm.reInit.formWarning;

  readonly nodeIpOptions$ = this.appService.getBindIpChoices().pipe(choicesToOptions());

  readonly routeInterfaceOptions$ = this.appService.getInterfaces().pipe(
    map((interfaces) => {
      return interfaces.map((networkInterface) => ({
        label: networkInterface.name,
        value: networkInterface.name,
      }));
    }),
  );

  private oldConfig: KubernetesConfig;

  constructor(
    protected ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private slideInRef: IxSlideInRef<KubernetesSettingsComponent>,
    private appService: ApplicationsService,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  onSubmit(): void {
    const { enable_container_image_update: enableContainerImageUpdate, ...values } = this.form.value;

    this.showReInitConfirm(values).pipe(
      filter(Boolean),
      switchMap(() => {
        return forkJoin([
          this.ws.job('kubernetes.update', [values]),
          this.appService.updateContainerConfig(enableContainerImageUpdate),
        ]).pipe(
          this.loader.withLoader(),
          tap(([job]) => {
            if (job.state !== JobState.Success) {
              return;
            }
            this.slideInRef.close();
          }),
          catchError((error) => {
            this.formErrorHandler.handleWsFormError(error, this.form);
            return EMPTY;
          }),
        );
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private loadSettings(): void {
    this.isFormLoading = true;
    forkJoin([
      this.ws.call('kubernetes.config'),
      this.appService.getContainerConfig(),
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([kubernetesConfig, containerConfig]) => {
        this.form.patchValue({
          ...kubernetesConfig,
          enable_container_image_update: containerConfig.enable_image_updates,
        });

        this.oldConfig = kubernetesConfig;
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  private wereReInitFieldsChanged(newValues: Partial<KubernetesConfigUpdate>): boolean {
    const reInitFields = ['cluster_cidr', 'service_cidr', 'cluster_dns_ip'] as const;

    return reInitFields.some((field) => newValues[field] !== this.oldConfig[field]);
  }

  private showReInitConfirm(values: Partial<KubernetesConfigUpdate>): Observable<boolean> {
    return this.wereReInitFieldsChanged(values)
      ? this.dialogService.confirm({
        title: helptext.kubForm.reInit.title,
        message: helptext.kubForm.reInit.modalWarning,
      })
      : of(true);
  }
}
