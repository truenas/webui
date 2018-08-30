import { Theme } from 'app/services/theme/theme.service';

export interface UserPreferences {
  platform:string; // FreeNAS || TrueNAS
  timestamp:Date;
  userTheme:string; // Theme name
  customThemes?: Theme[]; 
  favoriteThemes?: string[]; // Theme Names
  showTooltips:boolean; // Form Tooltips on/off
  metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)
  allowPwToggle:boolean;
}
