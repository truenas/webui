import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiInterface, IscsiPortal } from 'app/interfaces/iscsi.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ipValidator } from 'app/modules/ix-forms/validators/ip-validation';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './portal-form.component.html',
  styleUrls: ['./portal-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalFormComponent implements OnInit {
  isLoading = false;
  listen: IscsiInterface[] = [];

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
    ip: this.fb.array<string>([]),
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
  readonly authgroupOptions$ = this.iscsiService.getAuth().pipe(
    map((auth) => {
      return auth.map((item) => ({
        label: String(item.tag),
        value: item.tag,
      }));
    }),
  );
  readonly listenOptions$ = this.iscsiService.getIpChoices().pipe(choicesToOptions());

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    protected iscsiService: IscsiService,
    private slideInRef: IxSlideInRef<PortalFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingIscsiPortal: IscsiPortal,
  ) {}

  ngOnInit(): void {
    if (this.editingIscsiPortal) {
      this.setupForm();
    }
  }

  setupForm(): void {
    this.editingIscsiPortal.listen.forEach((listen) => {
      const newListItem = {} as IscsiInterface;
      newListItem.ip = listen.ip;
      this.form.controls.ip.push(this.fb.control(listen.ip, [Validators.required, ipValidator('all')]));
      this.listen.push(newListItem);
    });

    this.form.patchValue({
      ...this.editingIscsiPortal,
    });
    this.cdr.markForCheck();
  }

  onAdd(): void {
    this.form.controls.ip.push(this.fb.control('', [Validators.required, ipValidator('all')]));
    this.listen.push({ ip: '' } as IscsiInterface);
  }

  onDelete(index: number): void {
    this.listen.splice(index, 1);
  }

  onSubmit(): void {
    const values = this.form.value;
    const params = {
      comment: values.comment,
      discovery_authmethod: values.discovery_authmethod,
      discovery_authgroup: values.discovery_authgroup,
      listen: values.ip.map((ip) => ({ ip })) as IscsiInterface[],
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
        this.slideInRef.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
