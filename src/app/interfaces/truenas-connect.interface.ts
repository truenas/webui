import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export interface TruenasConnectRegistration {
  version: string;
  model: EnclosureModel;
  token: string;
  system_id: string;
}
