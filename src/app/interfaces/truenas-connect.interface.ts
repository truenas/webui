import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export interface HarborosConnectRegistration {
  version: string;
  model: EnclosureModel;
  token: string;
  system_id: string;
}
