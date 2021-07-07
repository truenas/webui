export interface IdmapBackendOptions {
  [key: string]: {
    description: string;
    parameters: {
      [parameter: string]: IdmapBackendParameter;
    };
    has_secrets: boolean;
    services: string[];
  };
}

export interface IdmapBackendParameter {
  default: string | boolean | number;
  required: boolean;
}
