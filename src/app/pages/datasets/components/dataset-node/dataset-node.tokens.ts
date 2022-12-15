import { InjectionToken } from '@angular/core';
import { DatasetDetails } from 'app/interfaces/dataset.interface';

export const datasetToken = new InjectionToken<DatasetDetails>('');
export const isSystemDatasetToken = new InjectionToken<boolean>('');
