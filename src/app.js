// @ts-check
import 'jquery';
import 'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import view from './view.js';
import rssParser from './rss-parser.js';

const UPDATE_INTERVAL = 5000;

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
    error: '',
    feedUrls: [],
    addedUrl: '',
    data: {
      feeds: [],
      posts: [],
    },
  };

  const updatePostsIfHaveUpdates = (posts, watchedState) => {
    const newPosts = _.differenceWith(posts, watchedState.data.posts, _.isEqual);
    if (newPosts.length) {
      _.set(watchedState, 'data.posts', [...newPosts, ...watchedState.data.posts]);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    if (path === 'addedUrl') {
      if (value === '') {
        return;
      }
      watchedState.processState = 'downloading';
      getFeedData(value)
        .then((result) => {
          watchedState.processState = 'downloaded';
          const { feed, posts } = rssParser(result.data.contents);
          watchedState.data.feeds = [feed, ...watchedState.data.feeds];
          watchedState.feedUrls = [...watchedState.feedUrls, value];
          updatePostsIfHaveUpdates(posts, watchedState);
          watchedState.processState = 'added';
        })
        .catch((e) => {
          watchedState.processState = 'failed';
          watchedState.error = e.message;
        }).then(() => {
          watchedState.addedUrl = '';
        });
    }
    if (path.indexOf('data.') === 0 || path === 'processState' || path === 'form.valid' || path === 'error') {
      view(path, value);
    }
  });

  // const updateFeedsTimer = (interval) => {
  //   setTimeout(() => {
  //     const urls = [...watchedState.feedUrls];
  //     const promises = urls.map((url) => getFeedData(url));
  //     const posts = Promise.allSettled(promises);
  //     return posts
  //       .then((results) => {
  //         results.forEach((result) => {
  //           console.log(rssParser(result.value.data.contents));
  //           updateFeedsTimer(interval);
  //         });
  //       })
  //       .catch((e) => console.log(e));
  //   }, interval);
  // };
  // updateFeedsTimer(UPDATE_INTERVAL);

  const updateStateWithValidateUrl = (url) => {
    const schema = yup.string().required().url().notOneOf(watchedState.feedUrls);
    watchedState.processState = 'validating';
    schema.validate(url)
      .then(() => {
        watchedState.form.valid = true;
        watchedState.error = '';
        watchedState.addedUrl = url;
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
