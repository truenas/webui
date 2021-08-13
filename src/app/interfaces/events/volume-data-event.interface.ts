import { ApiService } from 'app/core/services/api.service';
import { VolumeData } from '../volume-data.interface';

export interface VolumeDataEvent {
  name: 'VolumeData';
  sender: ApiService;
  data: VolumeData[];
}
