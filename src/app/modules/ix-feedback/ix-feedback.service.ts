import { HttpClient } from '@angular/common/http';
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
}
