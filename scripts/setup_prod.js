#!/usr/bin/env node
import fs from "fs";

// ng 7 requires this file to be there even though it replaces it upon runtime
const environment_ts = 'src/environments/environment.ts';

fs.closeSync(fs.openSync(environment_ts, 'w'));
