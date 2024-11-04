import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatListItemLine } from '@angular/material/list';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { unionBy } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { initiatorFormElements } from 'app/pages/sharing/iscsi/initiator/initiator-form/initiator-form.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
  standalone: true,
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
    MatListItemLine,
    MatCardActions,
    RequiresRolesDirective,
    TranslateModule,
    DualListBoxComponent,
  ],
})
export class InitiatorFormComponent implements OnInit {
  protected readonly searchableElements = initiatorFormElements;

  isFormLoading = false;
  pk: number;

  form = this.fb.group({
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
    return this.form.value.all;
  }

  readonly helptext = helptextSharingIscsi;
  readonly requiredRoles = [
    Role.SharingIscsiInitiatorWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor(
    private ws: WebSocketService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.activatedRoute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params.pk) {
        this.pk = parseInt(params.pk as string, 10);
        this.setForm();
      } else {
        this.isFormLoading = false;
      }
    });

    this.getConnectedInitiators();
  }

  onCancel(): void {
    this.router.navigate(['/', 'sharing', 'iscsi', 'initiator']);
  }

  onSubmit(): void {
    const payload = {
      comment: this.form.value.comment,
      initiators: this.isAllowAll ? [] : this.selectedInitiators().map((item) => item.id),
    };

    let request;
    if (this.pk === undefined) {
      request = this.ws.call('iscsi.initiator.create', [payload]);
    } else {
      request = this.ws.call('iscsi.initiator.update', [this.pk, payload]);
    }

    this.isFormLoading = true;
    request.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.onCancel();
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.dialog.error(this.errorHandler.parseError(error));
      },
    });
  }

  getConnectedInitiators(): void {
    this.ws.call('iscsi.global.sessions').pipe(untilDestroyed(this)).subscribe({
      next: (sessions) => {
        this.connectedInitiators.set(unionBy(sessions, (item) => item.initiator && item.initiator_addr));
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.dialog.error(this.errorHandler.parseError(error));
      },
    });
  }

  onAddInitiator(): void {
    const newInitiator = this.form.value.new_initiator;
    if (newInitiator) {
      if (!this.allInitiators().find((item) => item.id === newInitiator)) {
        this.customInitiators.set([...this.customInitiators(), { id: newInitiator, name: newInitiator }]);
        this.selectedInitiators.set([...this.selectedInitiators(), { id: newInitiator, name: newInitiator }]);
      }
      this.form.controls.new_initiator.setValue('');
    }
  }

  setForm(): void {
    this.ws.call('iscsi.initiator.query', [[['id', '=', this.pk]]])
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
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.dialog.error(this.errorHandler.parseError(error));
        },
      });
  }
}
