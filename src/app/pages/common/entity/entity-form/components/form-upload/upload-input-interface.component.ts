import { UploadFile } from 'ngx-uploader';
export interface CustomUploadInput {
    type: 'uploadAll' | 'uploadFile' | 'cancel' | 'cancelAll' | 'remove' | 'removeAll';
    url?: string;
    method?: string;
    id?: string;
    fieldName?: string;
    fileIndex?: number;
    file?: UploadFile;
    data?: {
        [key: string]: string | Blob | Array<any> | any;
    };
    headers?: {
        [key: string]: string;
    };
    withCredentials?: boolean;
}