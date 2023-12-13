import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import html2canvas, { Options } from 'html2canvas';
import {
  Observable, combineLatest, map, switchMap,
} from 'rxjs';
import {
  AddReview, AttachmentAddedResponse,
} from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { WebSocketService } from 'app/services/ws.service';
import { ReviewAddedResponse } from './interfaces/feedback.interface';

@Injectable()
export class IxFeedbackService {
  private readonly hostname = 'https://feedback.ui.truenas.com';

  constructor(
    private httpClient: HttpClient,
    private ws: WebSocketService,
  ) {}

  getHostId(): Observable<string> {
    return this.ws.call('system.host_id');
  }

  addReview(body: AddReview): Observable<ReviewAddedResponse> {
    return this.httpClient.post<ReviewAddedResponse>(`${this.hostname}/api/reviews/add/`, body);
  }

  addAttachment(reviewId: number, image: File): Observable<AttachmentAddedResponse> {
    const formData = new FormData();
    formData.append('image', image);

    return this.httpClient.post<AttachmentAddedResponse>(
      `${this.hostname}/api/reviews/${reviewId}/add-attachment/`,
      formData,
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
          const file = new File([blob], filename, { type });
          observer.next(file);
          observer.complete();
        }, type);
      }).catch((error) => {
        observer.error(error);
      });
    });
  }

  checkIfFeedbackAllowed(): Observable<boolean> {
    return combineLatest([
      this.ws.call('system.info'),
      this.ws.call('system.product_type'),
    ]).pipe(
      switchMap(([systemInfo, productType]) => {
        const params = new HttpParams();
        params.set('version', systemInfo.version);
        params.set('product_type', productType);

        return this.httpClient
          .get<{ value: boolean }>(`${this.hostname}/api/collect-blacklist/check`, { params })
          .pipe(map((response) => response.value));
      }),
    );
  }
}
