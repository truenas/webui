import { Command } from 'commander';
import { remoteCommand } from './commands/remote.command';
import { resetCommand } from './commands/reset.command';
import { checkEnvironment } from './utils/check-environment';
import { updateEnvironment } from './utils/save-environment';

/*
* Nice Header
* */
function banner(): string {
  return `  _____                _   _    _    ____   __        __   _     _   _ ___ 
 |_   _| __ _   _  ___| \\ | |  / \\  / ___|  \\ \\      / /__| |__ | | | |_ _|
   | || '__| | | |/ _ \\  \\| | / _ \\ \\___ \\   \\ \\ /\\ / / _ \\ '_ \\| | | || | 
   | || |  | |_| |  __/ |\\  |/ ___ \\ ___) |   \\ V  V /  __/ |_) | |_| || | 
   |_||_|   \\__,_|\\___|_| \\_/_/   \\_\\____/     \\_/\\_/ \\___|_.__/ \\___/|___|`;
}

const program: Command = new Command()
  .name('ui')
  .description('TrueNAS webui setup utility')
  .usage('(Call from root directory of repo via yarn)')
  .addHelpText('before', banner());

program
  .command('check-env')
  .name('check-env')
  .description('Validate environment.ts file')
  .action(() => checkEnvironment());

program
  .command('reset')
  .name('reset')
  .description('Reset config to default')
  .action(() => resetCommand());

program
  .command('remote')
  .description('Set the server WebUI communicates with')
  .option('-i, --ip <ip_address>', 'Sets IP address of your server')
  .option('-f, --force', 'Forces IP Address to be used without preprocessing')
  .action(async (options: { ip: string; force?: boolean }) => {
    await checkEnvironment();
    if (options.ip) {
      await updateEnvironment({
        mockConfig: {
          enabled: false,
        },
      });
      console.info('Disabling global mock due to remote change.');
    }

    await remoteCommand(options.ip, options.force || false);
  });

// Show help message if no arguments are provided
program
  .action(() => {
    program.help();
  });

program.parse(process.argv);
