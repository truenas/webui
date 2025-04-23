import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import html2canvas, { Options } from 'html2canvas';
import {
  Observable, combineLatest, filter, first, map, of, switchMap, forkJoin, throwError, EMPTY,
} from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { TicketType } from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport } from 'app/helptext/system/support';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import { FileTicketLicensedComponent } from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import {
  AddReview, AttachmentAddedResponse, FeedbackEnvironment, ReviewAddedResponse,
} from 'app/modules/feedback/interfaces/feedback.interface';
import {
  CreateNewTicket,
  NewTicketResponse,
  SimilarIssue,
} from 'app/modules/feedback/interfaces/file-ticket.interface';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SentryConfigurationService } from 'app/services/errors/sentry-configuration.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UploadService } from 'app/services/upload.service';
import { AppState } from 'app/store';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';
import { selectProductType, selectSystemInfoState, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

type ReviewData = FileReviewComponent['form']['value'];
type TicketData = FileTicketComponent['form']['value'];
type TicketLicensedData = ReturnType<FileTicketLicensedComponent['form']['getRawValue']>;

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly hostname = 'https://feedback.ui.truenas.com';
  private isFeedbackAllowed: boolean | undefined;

  constructor(
    private httpClient: HttpClient,
    private api: ApiService,
    private store$: Store<AppState>,
    private systemGeneralService: SystemGeneralService,
    private sentryService: SentryConfigurationService,
    private fileUpload: UploadService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogService: DialogService,
    @Inject(WINDOW) private window: Window,
  ) {}

  createReview(data: ReviewData): Observable<unknown> {
    return this.prepareReview(data).pipe(
      switchMap((review) => this.addReview(review)),
      switchMap((response) => {
        if (!response.success) {
          return throwError(() => new Error(
            this.translate.instant('An error occurred while sending the review. Please try again later.'),
          ));
        }

        return of(response);
      }),
      switchMap((reviewAdded) => {
        return this.addReviewAttachmentsIfNeeded(reviewAdded.review_id, data).pipe(
          catchError(() => {
            // Silently fail if attachments were not uploaded.
            return EMPTY;
          }),
        );
      }),
    );
  }

  createTicket(token: string, type: TicketType, data: TicketData): Observable<NewTicketResponse> {
    return this.prepareTicket(token, type, data).pipe(
      switchMap((ticket) => this.addTicket(ticket)),
      switchMap((createdTicket) => {
        return this.addTicketAttachmentsIfNeeded(
          createdTicket.ticket,
          data,
          token,
        ).pipe(switchMap(() => of(createdTicket)));
      }),
    );
  }

  createTicketLicensed(data: TicketLicensedData): Observable<NewTicketResponse> {
    return this.prepareTicketLicensed(data).pipe(
      switchMap((ticket) => this.addTicket(ticket)),
      switchMap((createdTicket) => {
        return this.addTicketAttachmentsIfNeeded(
          createdTicket.ticket,
          data,
        ).pipe(switchMap(() => of(createdTicket)));
      }),
    );
  }

  takeScreenshot(filename = `${Date.now()}.png`, type = 'image/png', options?: Partial<Options>): Observable<File> {
    return new Observable((observer) => {
      html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        imageTimeout: 0,
        ignoreElements: (element) => element.classList.contains('cdk-overlay-container'),
        ...options,
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            observer.error(new Error('Failed to create a screenshot.'));
            return;
          }

          const file = new File([blob], filename, { type });
          observer.next(file);
          observer.complete();
        }, type);
      }).catch((error: unknown) => {
        observer.error(error);
      });
    });
  }

  checkIfReviewAllowed(): Observable<boolean> {
    if (this.isFeedbackAllowed !== undefined) {
      return of(this.isFeedbackAllowed);
    }
    return combineLatest([
      this.store$.pipe(waitForSystemInfo),
      this.store$.select(selectProductType).pipe(filter((productType) => !!productType)),
    ]).pipe(
      first(),
      switchMap(([systemInfo, productType]) => {
        const params = new HttpParams()
          .set('version', systemInfo.version)
          .set('product_type', productType);

        return this.httpClient
          .get<{ value: boolean }>(`${this.hostname}/api/collect-blacklist/check/`, { params })
          .pipe(
            map((response) => {
              this.isFeedbackAllowed = !response.value;
              return !response.value;
            }),
            catchError(() => {
              this.isFeedbackAllowed = false;
              return of(false);
            }),
          );
      }),
    );
  }

  getSimilarIssues(query: string): Observable<SimilarIssue[]> {
    return this.api.call('support.similar_issues', [query]);
  }

  addDebugInfoToMessage(message: string): Observable<string> {
    return this.sentryService.sessionId$.pipe(
      take(1),
      map((sessionId) => {
        const sessionText = `Session ID: ${sessionId}`;
        return [message, sessionText].join('\n\n');
      }),
    );
  }

  showTicketSuccessMessage(ticketUrl: string): void {
    this.dialogService.generalDialog({
      message: this.translate.instant('Thank you. Ticket was submitted successfully.'),
      icon: iconMarker('mdi-check'),
      title: this.translate.instant('Ticket Created'),
      cancelBtnMsg: this.translate.instant('Close'),
      confirmBtnMsg: this.translate.instant('Open ticket'),
    })
      .subscribe((openTicket) => {
        if (openTicket) {
          this.window.open(ticketUrl, '_blank');
        }
      });
  }

  showFeedbackSuccessMessage(): void {
    this.snackbar.success(
      this.translate.instant(
        'Thank you for sharing your feedback with us! Your insights are valuable in helping us improve our product.',
      ),
    );
  }

  private addReview(body: AddReview): Observable<ReviewAddedResponse> {
    return this.httpClient.post<ReviewAddedResponse>(`${this.hostname}/api/reviews/add/`, body);
  }

  private prepareReview(data: ReviewData): Observable<AddReview> {
    return this.getSystemInfo().pipe(
      map(([{ systemInfo, isIxHardware }, systemHostId]) => {
        return {
          host_u_id: systemHostId,
          rating: Number(data.rating),
          message: data.message || '',
          page: this.window.location.pathname,
          user_agent: this.window.navigator.userAgent,
          environment: environment.production ? FeedbackEnvironment.Production : FeedbackEnvironment.Development,
          release: systemInfo.version,
          product_type: this.systemGeneralService.getProductType(),
          product_model: systemInfo.system_product && isIxHardware ? systemInfo.system_product : 'Generic',
          extra: {},
        };
      }),
    );
  }

  private addReviewAttachmentsIfNeeded(reviewId: number, data: ReviewData): Observable<unknown> {
    const operations = [];

    if (data.take_screenshot) {
      operations.push(
        this.takeScreenshot().pipe(
          switchMap((file) => this.addReviewAttachment(reviewId, file)),
        ),
      );
    }

    if (data.attach_images && data.images?.length) {
      operations.push(
        ...data.images.map((image) => this.addReviewAttachment(reviewId, image)),
      );
    }

    if (!operations.length) {
      return of(undefined);
    }

    return forkJoin(operations);
  }

  private addReviewAttachment(reviewId: number, image: File): Observable<AttachmentAddedResponse> {
    const formData = new FormData();
    formData.append('image', image);

    return this.httpClient.post<AttachmentAddedResponse>(
      `${this.hostname}/api/reviews/${reviewId}/add-attachment/`,
      formData,
    );
  }

  private getSystemInfo(): Observable<[SystemInfoState & { systemInfo: SystemInfo }, string]> {
    return forkJoin([
      this.store$.pipe(
        select(selectSystemInfoState),
        filter((systemInfoState) => Boolean(systemInfoState.systemInfo)),
        map((systemInfoState) => systemInfoState as SystemInfoState & { systemInfo: SystemInfo }),
        take(1),
      ),
      this.api.call('system.host_id'),
    ]);
  }

  private addTicket(ticket: CreateNewTicket): Observable<NewTicketResponse> {
    return this.api.job('support.new_ticket', [ticket]).pipe(
      filter((job) => job.state === JobState.Success),
      map((job) => job.result),
    );
  }

  private prepareTicket(token: string, type: TicketType, data: TicketData): Observable<CreateNewTicket> {
    return this.addDebugInfoToMessage(data.message || '').pipe(
      map((body) => ({
        body,
        token,
        attach_debug: Boolean(data.attach_debug),
        type,
        title: data.title || '',
      })),
    );
  }

  private prepareTicketLicensed(data: TicketLicensedData): Observable<CreateNewTicket> {
    return this.addDebugInfoToMessage(data.message || '').pipe(
      map((body) => ({
        body,
        name: data.name,
        email: data.email,
        phone: data.phone,
        cc: data.cc,
        environment: data.environment,
        criticality: data.criticality,
        category: data.category,
        title: data.title,
        attach_debug: Boolean(data.attach_debug),
      })),
    );
  }

  private addTicketAttachmentsIfNeeded(
    ticketId: number,
    data: TicketData,
    token?: string,
  ): Observable<void> {
    const takeScreenshot = data.take_screenshot;
    const images = data.images || [];

    // Make requests and map to boolean for successful uploads.
    const requests = images.map((attachment) => {
      return this.addTicketAttachment({ ticketId, attachment, token });
    });

    if (takeScreenshot) {
      const takeScreenshotRequest$ = this.takeScreenshot().pipe(
        switchMap((screenshot) => this.addTicketAttachment({ ticketId, attachment: screenshot, token })),
      );
      requests.push(takeScreenshotRequest$);
    }

    if (requests.length === 0) {
      return of(undefined);
    }

    // TODO: Check what happens if more than 20 attachments are uploaded at the same time.
    return forkJoin(requests).pipe(
      switchMap((results) => {
        const wereAllImagesUploaded = results.every(Boolean);
        if (wereAllImagesUploaded) {
          return of(undefined);
        }

        return throwError(() => new Error('Not all images were uploaded.'));
      }),
      catchError(() => {
        // Do not fail if attachments were not uploaded.
        this.dialogService.error({
          title: this.translate.instant(helptextSystemSupport.attachmentsFailed.title),
          message: this.translate.instant(helptextSystemSupport.attachmentsFailed.message),
        });

        return of(undefined);
      }),
    );
  }

  private addTicketAttachment({
    ticketId,
    attachment,
    token,
  }: {
    ticketId: number;
    attachment: File;
    token?: string;
  }): Observable<boolean> {
    return this.fileUpload.upload({
      file: attachment,
      method: 'support.attach_ticket',
      params: [{
        token,
        ticket: ticketId,
        filename: attachment.name,
      }],
    }).pipe(
      filter((event) => event instanceof HttpResponse),
      take(1),
      map(() => true),
      catchError((error: unknown) => {
        console.error(error);
        return of(false);
      }),
    );
  }
}
