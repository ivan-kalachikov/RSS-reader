// @ts-check

import { promises as fs } from 'fs';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import nock from 'nock';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import path from 'path';
import app from '../src/app';
import parseRss from '../src/parse-rss.js';
import expectedParsedData from './__fixtures__/expected';
import localization from '../src/locales/en.js';
import { proxyURL } from '../src/constants';

const { feedbackMessages } = localization.translation;

beforeEach(async () => {
  nock.cleanAll();
  nock.disableNetConnect();
  const html = await fs.readFile('index.html', 'utf-8');
  document.body.innerHTML = html;
  axios.defaults.adapter = httpAdapter;
  app();
});

test('add success / add exist url error', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  const successfulResponse = await fs.readFile(path.resolve(__dirname, '__fixtures__', 'successful-response.xml'), 'utf-8');
  nock(proxyURL)
    .persist(true)
    .get('/')
    .query(true)
    .reply(200, successfulResponse);
  userEvent.type(input, 'https://ru.hexlet.io/lessons.rss');
  userEvent.click(button);
  expect(await screen.findByText(feedbackMessages.newUrlAdded)).toBeInTheDocument();
  userEvent.type(input, 'https://ru.hexlet.io/lessons.rss');
  userEvent.click(button);
  expect(await screen.findByText(feedbackMessages.alreadyExistRSS)).toBeInTheDocument();
});

test('parseRss test', async () => {
  const pathToRss = path.resolve(__dirname, '__fixtures__/rss-feed.xml');
  const rssData = await fs.readFile(pathToRss, 'utf8');
  expect(parseRss(rssData)).toEqual(expectedParsedData);
});

test('wrong url', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'wrong url');
  userEvent.click(button);
  expect(await screen.findByText(feedbackMessages.invalidURL)).toBeInTheDocument();
});

test('block ui while getting data, and unblock after that', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  nock(proxyURL)
    .get('/get')
    .query(true)
    .reply(200);
  userEvent.type(input, 'https://ru.hexlet.io/lessons.rss');
  userEvent.click(button);
  await waitFor(() => {
    expect(input).toHaveAttribute('readonly');
    expect(button).toBeDisabled();
  });
  await waitFor(() => {
    expect(input).not.toHaveAttribute('readonly');
    expect(button).toBeEnabled();
  }, { delay: 100 });
});

test('invalid rss error', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  nock(proxyURL)
    .get('/')
    .query(true)
    .reply(200);
  userEvent.type(input, 'https://ru.hexlet.io/invalid.rss');
  userEvent.click(button);
  expect(await screen.findByText(feedbackMessages.invalidRSS)).toBeInTheDocument();
});

test('network error', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://ru.hexlet.io/lessons.rss');
  userEvent.click(button);
  expect(await screen.findByText(feedbackMessages.networkError)).toBeInTheDocument();
});
