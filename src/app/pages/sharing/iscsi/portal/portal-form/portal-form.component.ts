import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, inject, input,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextIscsi } from 'app/helptext/sharing';
import { IscsiInterface, IscsiPortal } from 'app/interfaces/iscsi.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { ipValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-portal-form',
  templateUrl: './portal-form.component.html',
  styleUrls: ['./portal-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    IxListComponent,
    IxListItemComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class PortalFormComponent extends IxFormHostForm implements OnInit {
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  protected api = inject(ApiService);
  protected iscsiService = inject(IscsiService);

  /** Edit data supplied by the `<tn-side-panel>` host. */
  readonly portalData = input<IscsiPortal | undefined>(undefined);

  listen: IscsiInterface[] = [];

  get isNew(): boolean {
    return !this.editingIscsiPortal;
  }

  form = this.fb.group({
    comment: [''],
    ip: this.fb.array<string>([], [Validators.required]),
  });

  readonly labels = {
    comment: helptextIscsi.portal.descriptionLabel,
    ip: helptextIscsi.portal.ipLabel,
    port: helptextIscsi.portal.portLabel,
  };

  readonly tooltips = {
    ip: helptextIscsi.portal.ipTooltip,
    port: helptextIscsi.portal.portTooltip,
  };

  readonly listenOptions$ = this.iscsiService.getIpChoices().pipe(choicesToOptions());

  protected editingIscsiPortal: IscsiPortal | undefined;

  protected readonly requiredRoles = [
    Role.SharingIscsiPortalWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  ngOnInit(): void {
    // Edit data arrives via the `portalData` input from the side-panel host.
    this.editingIscsiPortal = this.portalData();

    if (this.editingIscsiPortal) {
      this.setupForm(this.editingIscsiPortal);
    }
  }

  setupForm(portal: IscsiPortal): void {
    portal.listen.forEach((listen) => {
      const newListItem = {} as IscsiInterface;
      newListItem.ip = listen.ip;
      this.form.controls.ip.push(this.fb.control(listen.ip, [Validators.required, ipValidator('all')]));
      this.listen.push(newListItem);
    });

    this.form.patchValue({
      ...portal,
    });
  }

  protected onAdd(): void {
    this.form.controls.ip.push(this.fb.control('', [Validators.required, ipValidator('all')]));
    this.listen.push({ ip: '' } as IscsiInterface);
  }

  protected onDelete(index: number): void {
    this.form.controls.ip.removeAt(index);
    this.listen.splice(index, 1);
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const values = this.form.value;
    const params = {
      comment: values.comment,
      listen: values.ip.map((ip) => ({ ip })) as IscsiInterface[],
    };

    const request$: Observable<unknown> = this.editingIscsiPortal
      ? this.api.call('iscsi.portal.update', [this.editingIscsiPortal.id, params])
      : this.api.call('iscsi.portal.create', [params]);

    return {
      request$,
      successMessage: this.isNew
        ? this.translate.instant('Portal added')
        : this.translate.instant('Portal updated'),
    };
  };
}
