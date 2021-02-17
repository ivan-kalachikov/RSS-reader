// @ts-check
import 'jquery';
import 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import view from './view.js';
import rssParser from './rss-parser.js';

i18next.init({
  lng: 'en',
  debug: false,
  resources: {
    en: {
      translation: {
        feedbackMessages: {
          alreadyExistRSS: 'Rss already exists',
          addedSuccessfully: 'RSS added successfully',
          invalidURL: 'this must be a valid URL',
        },
        ui: {
          previewButton: 'Preview',
          feedsTitle: 'Feeds',
          postsTitle: 'Posts',
        },
      },
    },
  },
});

yup.setLocale({
  mixed: {
    notOneOf: i18next.t('feedbackMessages.alreadyExistRSS'),
  },
  string: {
    url: i18next.t('feedbackMessages.invalidURL'),
  },
});

const app = () => {
  const form = document.querySelector('.rss-form');

  const getFeedData = (url) => {
    const encodedURI = encodeURIComponent(url);
    return axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodedURI}&disableCache=true`);
  };

  const state = {
    processState: 'filling',
    form: {
      valid: true,
    },
    data: {
      feeds: [],
      posts: [],
    },
    error: [],
    feedUrls: [],
    addUrl: '',
  };

  const watchedState = onChange(state, (path, value) => {
    if (path === 'addUrl') {
      if (value === '') {
        return;
      }
      watchedState.processState = 'downloading';
      getFeedData(value)
        .then((result) => {
          watchedState.processState = 'downloaded';
          const { feed, posts } = rssParser(result.data.contents);
          watchedState.data.feeds = [feed, ...watchedState.data.feeds];
          watchedState.data.posts = [...posts, ...watchedState.data.posts];
          watchedState.feedUrls = [...watchedState.feedUrls, value];
          watchedState.processState = 'added';
        })
        .catch((e) => {
          watchedState.processState = 'failed';
          watchedState.error = e.message;
        }).then(() => {
          watchedState.addUrl = '';
        });
    }
    if (path === 'data.feeds' || path === 'data.posts' || path === 'processState' || path === 'form.valid' || path === 'error') {
      view(path, value);
    }
  });

  const updateStateWithValidateUrl = (url) => {
    const schema = yup.string().required().url().notOneOf(watchedState.feedUrls);
    watchedState.processState = 'validating';
    schema.validate(url)
      .then(() => {
        watchedState.form.valid = true;
        watchedState.error = '';
        watchedState.addUrl = url;
      })
      .catch((error) => {
        watchedState.form.valid = false;
        watchedState.error = error.message;
      });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    updateStateWithValidateUrl(url);
  });
};

export default app;
