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
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/apps/apps';
import { KubernetesConfig, KubernetesConfigUpdate } from 'app/interfaces/kubernetes-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import {
  AppLoaderService, DialogService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
    validate_host_path: [true],
    cluster_cidr: ['', Validators.required],
    service_cidr: ['', Validators.required],
    cluster_dns_ip: ['', Validators.required],
  });

  readonly tooltips = {
    node_ip: helptext.kubForm.node_ip.tooltip,
    route_v4_interface: helptext.kubForm.route_v4_interface.tooltip,
    route_v4_gateway: helptext.kubForm.route_v4_gateway.tooltip,
    enable_container_image_update: helptext.kubForm.enable_container_image_update.tooltip,
    cluster_cidr: helptext.kubForm.cluster_cidr.tooltip,
    service_cidr: helptext.kubForm.service_cidr.tooltip,
    cluster_dns_ip: helptext.kubForm.cluster_dns_ip.tooltip,
  };

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

  get validateHostPathWarning(): string {
    return !this.form.controls.validate_host_path.value
      ? helptext.kubForm.validateHostPathWarning.modalWarning : '';
  }

  constructor(
    protected ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private slideInService: IxSlideInService,
    private appService: ApplicationsService,
    private fb: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
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
      error: (error) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    });
  }

  onSubmit(): void {
    const { enable_container_image_update: enableContainerImageUpdate, ...values } = this.form.value;

    this.showReInitConfirm(values).pipe(
      filter(Boolean),
      switchMap(() => {
        this.loader.open();
        return forkJoin([
          this.ws.job('kubernetes.update', [values]),
          this.appService.updateContainerConfig(enableContainerImageUpdate),
        ]).pipe(
          tap(([job]) => {
            if (job.state !== JobState.Success) {
              return;
            }
            this.loader.close();
            this.slideInService.close();
          }),
          catchError((error) => {
            this.loader.close();
            this.errorHandler.handleWsFormError(error, this.form);
            return EMPTY;
          }),
        );
      }),
      untilDestroyed(this),
    ).subscribe();
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
