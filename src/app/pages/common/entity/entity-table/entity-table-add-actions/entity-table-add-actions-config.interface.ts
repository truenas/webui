export interface EntityTableAddActionsConfig {
  isCustActionVisible?: (action: string) => boolean;
  custActions?: {
    id: string;
    name: string;
    function: () => void;
  }[];
  title?: string;
  globalConfig?: {
    id: string;
    tooltip?: string;
    icon?: string;
    onClick: () => void;
  };
}
