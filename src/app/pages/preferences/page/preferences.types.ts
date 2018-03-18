import { Theme } from 'app/services/theme/theme.service';

export interface UserPreferences {
  userTheme:string;
  customThemes?: Theme[];
  favoriteThemes?: string[];
  showGuide:boolean;
  showTooltips:boolean;
  metaphor:string;
}
