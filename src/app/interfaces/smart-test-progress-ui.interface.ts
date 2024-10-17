import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface SmartTestProgressUi {
  diskName: string;
  diskIdentifier: string;
  wsError: unknown;
  progressPercentage: number;
  finished: boolean;
  estimatedEnd: ApiTimestamp;
  type: SmartTestType;
}
