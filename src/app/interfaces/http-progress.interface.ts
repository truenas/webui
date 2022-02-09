import { HttpEventType } from '@angular/common/http';

export interface UploadProgressUpdate {
  progress: number;
  status: HttpEventType;
}
