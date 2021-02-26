// @ts-check

import { promises as fs } from 'fs';
import path from 'path';
import rssParser from '../src/rss-parser';
import expectedParsedData from './__fixtures__/expected';

test('rssParser test', async () => {
  const pathToRss = path.resolve(__dirname, '__fixtures__/rss-feed.xml');
  const rssData = await fs.readFile(pathToRss, 'utf8');
  expect(rssParser(rssData)).toEqual(expectedParsedData);
});
