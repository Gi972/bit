/** @flow */
import Command from '../../command';
import { outputJsonFile } from '../../../utils';
import { ciUpdateAction } from '../../../api/scope';
import { paintCiResults } from '../../chalk-box';

export default class CiUpdate extends Command {
  name = 'ci-update <id> [scopePath]';
  description = 'run an update for build and test of a certain bit-component';
  alias = '';
  opts = [
    ['v', 'verbose', 'showing npm verbose output for inspection'],
    ['d', 'directory [file]', 'directory to run ci-update'],
    ['k', 'keep', 'keep test environment after run (default false)'],
    ['o', 'output [file]', 'save ci results to file system']
  ];
  private = true;

  action(
    [id, scopePath]: [string, ?string],
    {
      verbose,
      directory,
      output,
      keep = false
    }: { verbose: ?boolean, directory: ?string, output: ?string, keep: boolean }
  ): Promise<any> {
    verbose = true; // During ci-update we always want to see verbose outputs
    return ciUpdateAction(
      id,
      scopePath || process.cwd(),
      verbose,
      directory,
      keep
    ).then(({ specsResults, buildResults, component }) => ({ specsResults, buildResults, component, output }));
  }

  report({ specsResults, buildResults, component, output }): string {
    if (!specsResults && !buildResults) {
      return 'no results found';
    }

    if (specsResults instanceof Error) {
      return specsResults.message;
    }
    if (buildResults instanceof Error) {
      return buildResults.message;
    }
    if (output) {
      const ci = {};
      ci.specResults = specsResults;
      ci.mainDistFile = component.calculateMainDistFile();
      ci.component = component;
      ci.cwd = component.writtenPath;
      ci.buildResults = buildResults;
      outputJsonFile(output, ci);
    }

    return paintCiResults({ specsResults, buildResults });
  }
}
