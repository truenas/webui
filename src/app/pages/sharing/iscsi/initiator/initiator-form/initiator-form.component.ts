import {
  ChangeDetectionStrategy, Component, computed, OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { unionBy } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextIscsi } from 'app/helptext/sharing';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { initiatorFormElements } from 'app/pages/sharing/iscsi/initiator/initiator-form/initiator-form.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface InitiatorItem {
  id: string;
  name: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-initiator-form',
  templateUrl: './initiator-form.component.html',
  styleUrls: ['./initiator-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatProgressBar,
    ReactiveFormsModule,
    MatCardContent,
    IxCheckboxComponent,
    IxInputComponent,
    MatButton,
    TestDirective,
    IxIconComponent,
    MatCardActions,
    RequiresRolesDirective,
    TranslateModule,
    DualListBoxComponent,
  ],
})
export class InitiatorFormComponent implements OnInit {
  protected readonly searchableElements = initiatorFormElements;

  protected isFormLoading = signal(false);
  pk: number;

  form = this.fb.nonNullable.group({
    all: [false],
    comment: [''],
    new_initiator: [''],
  });

  connectedInitiators = signal([] as IscsiGlobalSession[]);
  customInitiators = signal([] as InitiatorItem[]);
  selectedInitiators = signal([] as InitiatorItem[]);

  allInitiators = computed(() => {
    return this.connectedInitiators().map((item) => ({
      id: item.initiator,
      name: `${item.initiator} (${item.initiator_addr})`,
    })).concat(this.customInitiators());
  });

  get isAllowAll(): boolean {
    return this.form.getRawValue().all;
  }

  readonly helptext = helptextIscsi;
  protected readonly requiredRoles = [
    Role.SharingIscsiInitiatorWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor(
    private api: ApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.activatedRoute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params.pk) {
        this.pk = parseInt(params.pk as string, 10);
        this.setForm();
      } else {
        this.isFormLoading.set(false);
      }
    });

    this.getConnectedInitiators();
  }

  protected onCancel(): void {
    this.router.navigate(['/', 'sharing', 'iscsi', 'initiators']);
  }

  protected onSubmit(): void {
    const payload = {
      comment: this.form.getRawValue().comment,
      initiators: this.isAllowAll ? [] : this.selectedInitiators().map((item) => item.id),
    };

    let request;
    if (this.pk === undefined) {
      request = this.api.call('iscsi.initiator.create', [payload]);
    } else {
      request = this.api.call('iscsi.initiator.update', [this.pk, payload]);
    }

    this.isFormLoading.set(true);
    request.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.onCancel();
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected getConnectedInitiators(): void {
    this.api.call('iscsi.global.sessions').pipe(untilDestroyed(this)).subscribe({
      next: (sessions) => {
        this.connectedInitiators.set(unionBy(sessions, (item) => item.initiator && item.initiator_addr));
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected onAddInitiator(): void {
    const newInitiator = this.form.value.new_initiator;
    if (newInitiator) {
      if (!this.allInitiators().find((item) => item.id === newInitiator)) {
        this.customInitiators.set([...this.customInitiators(), { id: newInitiator, name: newInitiator }]);
        this.selectedInitiators.set([...this.selectedInitiators(), { id: newInitiator, name: newInitiator }]);
      }
      this.form.controls.new_initiator.setValue('');
    }
  }

  private setForm(): void {
    this.api.call('iscsi.initiator.query', [[['id', '=', this.pk]]])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (initiators) => {
          if (initiators.length) {
            const initiator = initiators[0];
            this.form.controls.comment.setValue(initiator.comment);
            this.form.controls.all.setValue(initiator.initiators.length === 0);
            this.customInitiators.set(initiator.initiators.map((item) => ({ id: item, name: item })));
            this.selectedInitiators.set(initiator.initiators.map((item) => ({ id: item, name: item })));
          }
          this.isFormLoading.set(false);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
