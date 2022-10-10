import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { choicesToOptions, tagArrayToOptions } from 'app/helpers/options.helper';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiInterface, IscsiPortal } from 'app/interfaces/iscsi.interface';
import { ipValidator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IscsiService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './portal-form.component.html',
  styleUrls: ['./portal-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalFormComponent {
  isLoading = false;
  private editingIscsiPortal: IscsiPortal;
  listen: IscsiInterface[] = [];
  listPrefix = '__';

  get isNew(): boolean {
    return !this.editingIscsiPortal;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Portal')
      : this.translate.instant('Edit Portal');
  }

  form = this.fb.group({
    comment: [''],
    discovery_authmethod: [IscsiAuthMethod.None],
    discovery_authgroup: [null as number],
  });

  readonly labels = {
    comment: helptextSharingIscsi.portal_form_placeholder_comment,
    discovery_authmethod: helptextSharingIscsi.portal_form_placeholder_discovery_authmethod,
    discovery_authgroup: helptextSharingIscsi.portal_form_placeholder_discovery_authgroup,
    ip: helptextSharingIscsi.portal_form_placeholder_ip,
    port: helptextSharingIscsi.portal_form_placeholder_port,
  };

  readonly tooltips = {
    comment: helptextSharingIscsi.portal_form_tooltip_comment,
    discovery_authmethod: helptextSharingIscsi.portal_form_tooltip_discovery_authmethod,
    discovery_authgroup: helptextSharingIscsi.portal_form_tooltip_discovery_authgroup,
    ip: helptextSharingIscsi.portal_form_tooltip_ip,
    port: helptextSharingIscsi.portal_form_tooltip_port,
  };

  readonly authmethodOptions$ = of([
    {
      label: 'NONE',
      value: IscsiAuthMethod.None,
    },
    {
      label: 'CHAP',
      value: IscsiAuthMethod.Chap,
    },
    {
      label: 'Mutual CHAP',
      value: IscsiAuthMethod.ChapMutual,
    },
  ]);
  readonly authgroupOptions$ = this.iscsiService.getAuth().pipe(tagArrayToOptions());
  readonly listenOptions$ = this.iscsiService.getIpChoices().pipe(choicesToOptions());

  private ipAddressFromControls = [
    {
      name: 'ip',
      default: '' as string,
      validator: [Validators.required, ipValidator('all')],
    },
  ];

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    protected iscsiService: IscsiService,
  ) {}

  setupForm(iscsiPortal: IscsiPortal): void {
    this.editingIscsiPortal = iscsiPortal;

    iscsiPortal.listen.forEach((listen, index) => {
      const newListItem = {} as IscsiInterface;
      this.ipAddressFromControls.forEach((fc) => {
        if (fc.name === 'ip') {
          const defaultValue = listen.ip;
          newListItem[fc.name] = defaultValue;
          this.form.addControl(`${fc.name}${this.listPrefix}${index}`, new FormControl(defaultValue, fc.validator));
        }
      });
      this.listen.push(newListItem);
    });

    this.form.patchValue({
      ...iscsiPortal,
    });
    this.cdr.markForCheck();
  }

  onAdd(): void {
    const newIndex = this.listen.length;
    const newListItem = {} as IscsiInterface;
    this.ipAddressFromControls.forEach((fc) => {
      newListItem[fc.name as keyof IscsiInterface] = fc.default;
      this.form.addControl(`${fc.name}${this.listPrefix}${newIndex}`, new FormControl(fc.default, fc.validator));
    });

    this.listen.push(newListItem);
  }

  onDelete(index: number): void {
    this.ipAddressFromControls.forEach((fc) => {
      this.form.removeControl(`${fc.name}${this.listPrefix}${index}`);
    });

    this.listen.splice(index, 1);
  }

  prepareSubmit(values: PortalFormComponent['form']['value']): IscsiInterface[] {
    const listen = [] as IscsiInterface[];

    const tempListen: { name: string; index: string; value: string | number | string[] }[] = [];
    Object.keys(values).forEach((key) => {
      const keys = key.split(this.listPrefix);
      if (keys.length > 1) {
        tempListen.push({ name: keys[0], index: keys[1], value: values[key as keyof PortalFormComponent['form']['value']] });
      }
    });

    Object.values(_.groupBy(tempListen, 'index')).forEach((item) => {
      const ip = item.find((ele) => ele.name === 'ip')?.value as string;
      if (ip) {
        listen.push({ ip });
      }
    });

    return listen;
  }

  onSubmit(): void {
    const values = this.form.value;
    const params = {
      comment: values.comment,
      discovery_authmethod: values.discovery_authmethod,
      discovery_authgroup: values.discovery_authgroup,
      listen: this.prepareSubmit(values),
    };

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('iscsi.portal.create', [params]);
    } else {
      request$ = this.ws.call('iscsi.portal.update', [this.editingIscsiPortal.id, params]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
