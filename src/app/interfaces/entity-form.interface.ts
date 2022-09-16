import { Subject } from 'rxjs';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { CoreEvent } from 'app/interfaces/events';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';

export interface FormConfiguration {
  fieldSets?: FieldSets | FieldSet[];
  fieldSetDisplay?: string;
  saveSubmitText?: string;
  target?: Subject<CoreEvent>;
  resourceName?: string;
  isEntity?: boolean;
  addCall?: ApiMethod;
  editCall?: ApiMethod;
  isCreateJob?: boolean;
  isEditJob?: boolean;
  queryCall?: ApiMethod;
  queryCallOption?: unknown[];
  queryKey?: string; // use this to define your id for websocket call
  isNew?: boolean;
  pk?: number | string;
  rowid?: number | string;
  fieldConfig?: FieldConfig[];
  routeCancel?: string[];
  routeSuccess?: string[];
  // TODO: Broken
  routeDelete?: string[];
  customActions?: FormCustomAction[];
  compactCustomActions?: FormCompactCustomAction[];
  customFilter?: any[];
  confirmSubmit?: boolean;
  confirmSubmitDialog?: {
    title: string;
    message: string;
    hideCheckbox?: boolean;
    button?: string;
  };
  saveButtonEnabled?: boolean;
  hideSaveBtn?: boolean;
  formMessage?: {
    type: string; // info || warning
    content: string;
  };
  isBasicMode?: boolean;
  advancedFields?: string[];
  basicFields?: string[];
  routeConf?: string[];
  initialCount?: number;
  initialCount_default?: number;
  title?: string;
  columnsOnForm?: number;

  prerequisite?(): Promise<boolean>;
  customEditCall?: (value: unknown) => void;
  responseOnSubmit?: (value: unknown) => void;
  clean?: (data: unknown) => unknown;
  errorReport?: (res: WebsocketError) => void;
  resourceTransformIncomingRestData?: (data: unknown) => unknown;
  preInit?: (entityForm: EntityFormComponent) => void;
  afterInit?: (entityForm: EntityFormComponent) => void;
  initial?: (entityForm: EntityFormComponent) => void;
  dataHandler?: (entityForm: EntityFormComponent) => void;
  dataAttributeHandler?: (entityForm: EntityFormComponent) => void;
  afterSave?: (entityForm: EntityFormComponent) => void;
  blurEvent?: (entityForm: EntityFormComponent) => void;
  afterSubmit?: (value: unknown) => void;
  beforeSubmit?: (value: unknown) => void;
  customSubmit?: (value: unknown) => void;
  closeModalForm?(): Promise<boolean>;
  afterModalFormClosed?(): void; // function will called once the modal form closed
  isCustomActionVisible?: (action: string) => boolean;
  isCustomActionDisabled?: (action: string) => boolean;
}

export interface FormCustomAction {
  id: string;
  name: string;
  function?: () => void;
  buttonColor?: string;
  disabled?: boolean;
  buttonType?: string;
}

export interface FormCompactCustomAction {
  id: string;
  name: string;
  function: () => void;
  disabled?: boolean;
}
