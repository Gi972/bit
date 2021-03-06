/** @flow */
import chalk from 'chalk';
import requestify from 'requestify';
import Command from '../../command';
import { searchAdapter } from '../../../search';
import { formatter } from '../../../search/searcher';
import { Doc } from '../../../search/indexer';
import loader from '../../../cli/loader';
import { SEARCH_DOMAIN } from '../../../constants';
import { BEFORE_REMOTE_SEARCH } from '../../../cli/loader/loader-messages';

export default class Search extends Command {
  name = 'search <query...>';
  description = 'search for components by desired functionality.';
  alias = '';
  opts = [['s', 'scope <scopename>', 'search in scope'], ['r', 'reindex', 're-index all components']];
  loader = true;

  action([query]: [string[]], { scope, reindex }: { scope: string, reindex: boolean }) {
    const queryStr = query.join(' ');
    if (scope) {
      loader.start(BEFORE_REMOTE_SEARCH({ scope, queryStr }));
      return searchAdapter.searchRemotely(queryStr, scope, reindex).catch(() => {
        // web search
        const url = `https://${SEARCH_DOMAIN}/search/?q=${queryStr}`;
        return requestify.get(url).then((response) => {
          const body = response.getBody();
          return Promise.resolve(body.payload.hits);
        });
      });
    }

    return searchAdapter.searchLocally(queryStr, reindex);
  }

  report(searchResults: Array<Doc | *>): string {
    if (!searchResults.length) {
      return chalk.yellow('no results found');
    }
    return chalk.green(searchResults.map(formatter).join('\n'));
  }
}
