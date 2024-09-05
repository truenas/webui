import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ProductType } from 'app/enums/product-type.enum';

export enum FeedbackType {
  Review = 'REVIEW',
  Bug = 'BUG',
  Suggestion = 'FEATURE',
}

export const feedbackTypesLabels = new Map<FeedbackType, string>([
  [FeedbackType.Review, T('Rate this page')],
  [FeedbackType.Bug, T('Report a bug')],
  [FeedbackType.Suggestion, T('Suggest an improvement')],
]);

export enum FeedbackEnvironment {
  Production = 'production',
  Development = 'development',
}

export interface Review {
  id: string;
  url: string;
  date_created: string;
  message: string;
  user_agent: string;
  environment: FeedbackEnvironment;
  rating: string;
  release: string;
  extra: object;
  host_u_id: string;
  attachments: string[];
}

export interface AddReview {
  rating: number;
  page: string;
  user_agent: string;
  release: string;
  environment: FeedbackEnvironment;
  message: string;
  extra: object;
  product_type: ProductType;
  product_model: string;
}

export interface ReviewAddedResponse {
  review_id: number;
  success: boolean;
}

export interface AttachmentAddedResponse {
  message: string;
  data: {
    data_created: string;
    filename: string;
    id: number;
  };
}
