// @ts-check

import { promises as fs } from 'fs';
import path from 'path';
import rssParser from '../src/rss-parser';
import expectedParsedData from './__fixtures__/expected';

let rssData;

beforeEach(async () => {
  const pathToRss = path.resolve(__dirname, '__fixtures__/rss-feed.xml');
  rssData = await fs.readFile(pathToRss, 'utf8');
});

test('rssParser test', () => {
  expect(rssParser(rssData)).toEqual(expectedParsedData);
});
