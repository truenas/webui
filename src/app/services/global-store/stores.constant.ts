import { globalStore } from 'app/services/global-store/global-store.service';

export const poolStore = globalStore('pool.query');
export const appStore = globalStore('app.query');
