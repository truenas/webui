import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  of, Observable, EMPTY, BehaviorSubject, throwError,
} from 'rxjs';
import {
  filter, map, switchMap, tap, catchError, take,
} from 'rxjs/operators';
import { TicketCriticality, TicketEnvironment, TicketType } from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { Job } from 'app/interfaces/job.interface';
import {
  CreateNewTicket, NewTicketResponse,
} from 'app/interfaces/support.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import IxValidatorsService from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-licensed-form.component.html',
  styleUrls: ['./file-ticket-licensed-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTicketLicensedFormComponent implements OnInit {
  isFormLoading = true;
  regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    cc: [[] as string[], [
      this.validatorsService.customValidator(
        (control: AbstractControl) => {
          return !control.value?.every((item: string) => item.match(this.regex));
        },
        this.translate.instant(helptext.cc.err),
      ),
    ]],
    phone: ['', [Validators.required]],
    category: [TicketType.Bug, [Validators.required]],
    environment: [TicketEnvironment.Production, [Validators.required]],
    criticality: [TicketCriticality.Inquiry, [Validators.required]],
    title: ['', Validators.required],
    body: ['', Validators.required],
    attach_debug: [false],
    screenshot: [null as FileList],
  });

  readonly categoryOptions$ = of(helptext.category.options);
  readonly environmentOptions$ = of(helptext.environment.options);
  readonly criticalityOptions$ = of(helptext.criticality.options);

  tooltips = {
    name: helptext.name.tooltip,
    email: helptext.email.tooltip,
    cc: helptext.cc.tooltip,
    phone: helptext.phone.tooltip,
    category: helptext.type.tooltip,
    environment: helptext.environment.tooltip,
    criticality: helptext.criticality.tooltip,
    title: helptext.title.tooltip,
    body: helptext.body.tooltip,
    attach_debug: helptext.attach_debug.tooltip,
    screenshot: helptext.screenshot.tooltip,
  };

  private screenshots: File[] = [];
  private get apiEndPoint(): string {
    return '/_upload?auth_token=' + this.ws.token;
  }
  jobs$: BehaviorSubject<Observable<Job>[]> = new BehaviorSubject([]);

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private slideIn: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private fileUpload: IxFileUploadService,
    private dialog: DialogService,
    private router: Router,
    private validatorsService: IxValidatorsService,
  ) { }

  ngOnInit(): void {
    this.isFormLoading = false;

    this.form.get('screenshot').valueChanges.pipe(
      switchMap((screenshots) => this.fileUpload.validateScreenshots(screenshots)),
      catchError((error: WebsocketError) => {
        this.errorHandler.handleWsFormError(error, this.form);

        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((validatedFiles) => {
      const validScreenshots = validatedFiles.filter((file) => !file.error).map((file) => file.file);
      const invalidFiles = validatedFiles.filter((file) => file.error).map((file) => file.error);
      this.screenshots = validScreenshots;
      if (invalidFiles.length) {
        const message = invalidFiles.map((error) => `${error.name} – ${error.errorMessage}`).join('\n');
        this.form.get('screenshot').setErrors({ ixManualValidateError: { message } });
      } else {
        this.form.get('screenshot').setErrors(null);
      }
      this.cdr.markForCheck();
    });
  }

  onSubmit(): void {
    const payload = { ...this.form.value };
    delete payload.screenshot;

    this.isFormLoading = true;
    this.ws.job('support.new_ticket', [payload as unknown as CreateNewTicket]).pipe(
      tap((job) => this.jobs$.next([this.getJobStatus(job.id)])),
      filter((job) => job.state === JobState.Success),
      untilDestroyed(this),
    ).subscribe((job) => {
      if (this.screenshots.length) {
        this.fileUpload.onUploading$.pipe(
          untilDestroyed(this),
        ).subscribe({
          error: () => {
            this.dialog.errorReport('Ticket', 'Uploading screenshots has failed');
          },
        });
        this.fileUpload.onUploaded$.pipe(
          take(this.screenshots.length),
          untilDestroyed(this),
        ).subscribe(
          () => {
            /** TODO:
             * Improve UX for uploading screenshots
             * HttpResponse have `job_id`, it can be used to show progress.
             * const jobId = (res.body as { job_id: number }).job_id;
             * this.jobs$.next([this.getJobStatus(jobId), ...this.jobs$.value]);
            */
          },
          (error) => {
            // TODO: Improve error handling
            console.error(error);
          },
          () => {
            this.isFormLoading = false;
            this.slideIn.close();
            this.openSuccessDialog(job.result);
          },
        );
        for (const file of this.screenshots) {
          this.fileUpload.upload(file, 'support.attach_ticket', [{
            ticket: job.result.ticket,
            filename: file.name,
          }], this.apiEndPoint);
        }
      } else {
        this.isFormLoading = false;
        this.slideIn.close();
        this.openSuccessDialog(job.result);
      }
    }, (error) => {
      console.error(error);
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }

  openSuccessDialog(params: NewTicketResponse): void {
    const conf: DialogFormConfiguration = {
      title: this.translate.instant('Ticket'),
      message: this.translate.instant('Congratulations! Your ticket has been submitted successfully. It may take some time before images appear.'),
      fieldConfig: [],
      cancelButtonText: this.translate.instant('Close'),
      saveButtonText: this.translate.instant('Open Ticket'),
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close();
        window.open(params.url, '_blank');
        this.dialog.closeAllDialogs();
      },
    };
    this.dialog.dialogForm(conf);
  }

  getJobStatus(id: number): Observable<Job> {
    return this.ws.call('core.get_jobs', [[['id', '=', id]]]).pipe(
      map((jobs) => jobs[0]),
      catchError((error) => throwError(error)),
    );
  }

  onUserGuidePressed(): void {
    window.open('https://www.truenas.com/docs/hub/');
  }

  onEulaPressed(): void {
    this.slideIn.close();
    this.router.navigate(['system', 'support', 'eula']);
  }
}
