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
    openedPostsIds: [],
    updatePostByTimer: false,
  };

  const updatePostsIfHaveUpdates = (posts, watchedState) => {
    const existPosts = watchedState.data.posts;
    const newPosts = _.differenceWith(posts, existPosts, _.isEqual);
    if (newPosts.length) {
      _.set(watchedState, 'data.posts', [...newPosts, ...existPosts]);
    }
  };

  const updateFeedsTimer = (interval, watchedState) => {
    setTimeout(() => {
      const feedUrls = [...watchedState.feedUrls];
      const promises = feedUrls.map((url) => getFeedData(url));
      const postsRequests = Promise.allSettled(promises);
      return postsRequests
        .then((results) => {
          const gettedPosts = [...results].reduce(
            (acc, result) => [...acc, ...rssParser(result.value.data.contents).posts], [],
          );
          updatePostsIfHaveUpdates(gettedPosts, watchedState);
        })
        .catch(() => {})
        .then(() => {
          updateFeedsTimer(interval, watchedState);
        });
    }, interval);
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
          if (!watchedState.updatePostByTimer) {
            updateFeedsTimer(UPDATE_INTERVAL, watchedState);
            watchedState.updatePostByTimer = true;
          }
        })
        .catch((e) => {
          watchedState.processState = 'failed';
          watchedState.error = e.message;
        }).then(() => {
          watchedState.addedUrl = '';
        });
    }
    if (path === 'processState' || path === 'form.valid' || path === 'error') {
      view(path, value);
    }
    if (path.indexOf('data.') === 0 || path === 'openedPostsIds') {
      view(path, value, onChange.target(watchedState));
    }
  });

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

  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    updateStateWithValidateUrl(url);
  });

  const postItemsGroup = document.querySelector('.posts');
  postItemsGroup.addEventListener('click', (e) => {
    const id = parseInt(e.target.dataset.id, 10);
    if (id && !watchedState.openedPostsIds.includes(id)) {
      watchedState.openedPostsIds = [id, ...watchedState.openedPostsIds];
    }
  });
};

export default app;
