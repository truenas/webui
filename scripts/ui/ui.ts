import { Command } from 'commander';
import * as figlet from 'figlet';
import { mockEnclosureCommand } from './commands/mock-enclosure.command';
import { remoteCommand } from './commands/remote.command';
import { resetCommand } from './commands/reset.command';
import { updateEnvironment } from './utils/save-environment.utils';

/*
* Nice Header
* */
function banner(): string {
  return figlet.textSync('TrueNAS WebUI');
}

const program: Command = new Command()
  .name('ui')
  .description('TrueNAS webui setup utility')
  .usage('(Call from root directory of repo via yarn)')
  .addHelpText('before', banner());

program
  .command('reset')
  .name('reset')
  .description('Reset config to default')
  .action(() => resetCommand());

program
  .command('mock-enclosure')
  .name('mock-enclosure')
  .alias('me')
  .description('Configure enclosure mocking functionality')
  .action(async () => {
    await mockEnclosureCommand();
  });

program
  .command('remote')
  .description('Set the server WebUI communicates with')
  .option('-i, --ip <ip_address>', 'Sets IP address of your server')
  .option('-f, --force', 'Forces IP Address to be used without preprocessing')
  .action((options: { ip: string; force?: boolean }) => {
    if (options.ip) {
      updateEnvironment({
        mockConfig: {
          enabled: false,
        },
      });
      console.info('Disabling global mock due to remote change.');
    }

    remoteCommand(options.ip, options.force);
  });

// Show help message if no arguments are provided
program
  .action(() => {
    program.help();
  });

program.parse(process.argv);
