export interface SnackbarConfig {
  message: string;
  iconCssColor?: string;
  icon?: string;
  button?: {
    title: string;
    action: () => void;
  };
}
