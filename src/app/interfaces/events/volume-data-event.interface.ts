import { Dataset } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/services/api.service';

export interface VolumeDataEvent {
  name: 'VolumeData';
  sender: ApiService;
  data: Dataset[];
}
