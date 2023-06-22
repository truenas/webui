import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddReview, AttachmentAddedResponse,
} from 'app/modules/ix-feedback/interfaces/feedback.interface';
import { ReviewAddedResponse } from './interfaces/feedback.interface';

@Injectable()
export class IxFeedbackService {
  private readonly hostname = 'https://feedback.ui.truenas.com';

  constructor(private httpClient: HttpClient) {}

  addReview(body: AddReview): Observable<ReviewAddedResponse> {
    const headers = new HttpHeaders({
      Authorization: 'Bearer 946bde8d85fc86c6c48344adf1ef2139',
    });

    return this.httpClient.post<ReviewAddedResponse>(
      `${this.hostname}/api/reviews/add/`,
      body,
      { headers },
    );
  }

  addAttachment(reviewId: number, image: File): Observable<AttachmentAddedResponse> {
    const formData = new FormData();
    formData.append('image', image);

    return this.httpClient.post<AttachmentAddedResponse>(
      `${this.hostname}/api/reviews/${reviewId}/add-attachment/`,
      formData,
    );
  }
}
