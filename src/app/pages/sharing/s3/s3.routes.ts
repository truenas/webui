import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { S3BucketListComponent } from 'app/pages/sharing/s3/s3-bucket-list/s3-bucket-list.component';

export const s3Routes: Routes = [
  {
    path: '',
    component: S3BucketListComponent,
    data: { title: T('S3'), breadcrumb: null },
  },
];
