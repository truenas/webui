import { ApiService } from 'app/core/services/api.service';
import { Dataset } from 'app/interfaces/dataset.interface';

export interface VolumeDataEvent {
  name: 'VolumeData';
  sender: ApiService;
  data: Dataset[];
}
