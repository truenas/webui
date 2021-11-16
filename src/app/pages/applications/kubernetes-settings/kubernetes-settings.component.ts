import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  EMPTY, forkJoin, of,
} from 'rxjs';
import {
  catchError, filter, map, switchMap, tap,
} from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/apps/apps';
import { KubernetesConfig, KubernetesConfigUpdate } from 'app/interfaces/kubernetes-config.interface';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
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

  readonly nodeIpOptions$ = this.appService.getBindIPChoices().pipe(choicesToOptions());

  readonly routeInterfaceOptions$ = this.appService.getInterfaces().pipe(
    map((interfaces) => {
      const options = interfaces.map((networkInterface) => ({
        label: networkInterface.name,
        value: networkInterface.name,
      }));

      return [
        { label: '---', value: null },
        ...options,
      ];
    }),
  );

  private oldConfig: KubernetesConfig;

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
    ]).pipe(untilDestroyed(this)).subscribe(
      ([kubernetesConfig, containerConfig]) => {
        this.form.patchValue({
          ...kubernetesConfig,
          enable_container_image_update: containerConfig.enable_image_updates,
        });

        this.oldConfig = kubernetesConfig;
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      (error) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        new EntityUtils().handleWSError(null, error, this.dialogService);
      },
    );
  }

  onSubmit(): void {
    const { enable_container_image_update: enableContainerImageUpdate, ...values } = this.form.value;

    (
      this.wereReInitFieldsChanged(values)
        ? this.dialogService.confirm({
          title: helptext.kubForm.reInit.title,
          message: helptext.kubForm.reInit.modalWarning,
        })
        : of(true)
    ).pipe(
      filter(Boolean),
      switchMap(() => {
        this.loader.open();
        return forkJoin([
          this.ws.job('kubernetes.update', [values]),
          this.appService.updateContainerConfig(enableContainerImageUpdate),
        ]).pipe(
          tap(() => {
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
}
