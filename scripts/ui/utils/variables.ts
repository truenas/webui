import { realpathSync } from 'fs';

const root = `${__dirname}/../../../`;
export const environmentTs = realpathSync(`${root}src/environments/environment.ts`);
export const environmentTemplate = realpathSync(`${root}scripts/ui/environment.ts.template`);
