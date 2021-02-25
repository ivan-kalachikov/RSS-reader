// @ts-check

import { promises as fs } from 'fs';
import path from 'path';
import { getByLabelText } from '@testing-library/dom';
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

test('rss feed url input form test', () => {
  const container = document.querySelector('main');
  const urlUnput = getByLabelText(container, 'url');
  const submitBtn = getByLabelText(container, 'add');
  console.log(urlUnput, submitBtn);
});
