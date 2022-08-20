export interface EntityTableAddActionsConfig {
  isCustomActionVisible?: (action: string) => boolean;
  customActions?: {
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
  filterValue?: string;
}
