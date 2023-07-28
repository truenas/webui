import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { NetworkService } from 'app/services/network.service';
import { WebSocketService } from 'app/services/ws.service';

interface InitiatorItem {
  id: string;
  name: string;
}

@UntilDestroy()
@Component({
  templateUrl: './initiator-form.component.html',
  styleUrls: ['./initiator-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NetworkService],
})
export class InitiatorFormComponent implements OnInit {
  isFormLoading = false;
  pk: number;

  form = this.fb.group({
    all: [false],
    comment: [''],
    new_initiator: [''],
  });

  connectedInitiators: IscsiGlobalSession[] = [];
  customInitiators: InitiatorItem[] = [];
  selectedInitiators: InitiatorItem[] = [];

  get allInitiators(): InitiatorItem[] {
    return this.connectedInitiators.map((item) => ({
      id: item.initiator,
      name: `${item.initiator} (${item.initiator_addr})`,
    })).concat(this.customInitiators);
  }

  get isAllowAll(): boolean {
    return this.form.value.all;
  }

  readonly helptext = helptextSharingIscsi;

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
        this.pk = parseInt(params.pk, 10);
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
      initiators: this.isAllowAll ? [] : this.selectedInitiators.map((item) => item.id),
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
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.dialog.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  getConnectedInitiators(): void {
    this.ws.call('iscsi.global.sessions').pipe(untilDestroyed(this)).subscribe({
      next: (sessions) => {
        this.connectedInitiators = _.unionBy(sessions, (item) => item.initiator && item.initiator_addr);
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.dialog.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  onAddInitiator(): void {
    const newInitiator = this.form.value.new_initiator;
    if (newInitiator) {
      if (!this.allInitiators.find((item) => item.id === newInitiator)) {
        this.customInitiators.push({ id: newInitiator, name: newInitiator });
        this.selectedInitiators.push({ id: newInitiator, name: newInitiator });
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
            this.customInitiators = initiator.initiators.map((item) => ({ id: item, name: item }));
            this.selectedInitiators = initiator.initiators.map((item) => ({ id: item, name: item }));
          }
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.dialog.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
