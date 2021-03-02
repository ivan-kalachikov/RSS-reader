// @ts-check
import 'jquery';
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
          alreadyExistRSS: 'RSS уже существует',
          newUrlAdded: 'RSS успешно загружен',
          invalidURL: 'Ссылка должна быть валидным URL',
          invalidRSS: 'Ресурс не содержит валидный RSS',
        },
        ui: {
          previewButton: 'Просмотр',
          feedsTitle: 'Фиды',
          postsTitle: 'Посты',
        },
      },
    },
  },
}).then(() => {
  yup.setLocale({
    mixed: {
      notOneOf: i18next.t('feedbackMessages.alreadyExistRSS'),
    },
    string: {
      url: i18next.t('feedbackMessages.invalidURL'),
    },
  });
});

const app = () => {
  const getDataFromUrl = (url) => {
    const encodedURI = encodeURIComponent(url);
    return axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodedURI}&disableCache=true`);
  };

  const state = {
    processState: '',
    form: {
      valid: true,
    },
    error: '',
    feedUrls: [],
    data: {
      feeds: [],
      posts: {
        items: [],
        opened: [],
      },
    },
    updatePostsByTimer: false,
  };

  const watchedState = onChange(state, (path, value) => {
    view(path, value, onChange.target(watchedState));
  });

  const addPostsIfHaveUpdates = (posts) => {
    const existPosts = watchedState.data.posts.items;
    const newPosts = _.differenceWith(posts, existPosts, _.isEqual);
    if (newPosts.length) {
      watchedState.data.posts.items = [...newPosts, ...existPosts];
    }
  };

  const updatePostsByTimer = (interval) => {
    setTimeout(() => {
      const feedUrls = [...watchedState.feedUrls];
      const promises = feedUrls.map((url) => getDataFromUrl(url));
      const postsRequests = Promise.allSettled(promises);
      return postsRequests
        .then((results) => {
          const receivedPosts = [...results].reduce(
            (acc, result) => [...acc, ...rssParser(result.value.data.contents).postItems], [],
          );
          addPostsIfHaveUpdates(receivedPosts, watchedState);
        })
        .catch((error) => {
          watchedState.error = error.message;
        })
        .finally(() => {
          updatePostsByTimer(interval, watchedState);
        });
    }, interval);
  };

  const updateStateWithValidateUrl = (url) => {
    const schema = yup.string().required().url().notOneOf(watchedState.feedUrls);
    return schema.validate(url)
      .then(() => {
        watchedState.form.valid = true;
        watchedState.error = '';
        return url;
      })
      .catch((error) => {
        watchedState.form.valid = false;
        watchedState.error = error.message;
      });
  };

  const proceedWithNewUrl = (url) => {
    if (!url) {
      return;
    }
    watchedState.processState = 'getting';
    getDataFromUrl(url)
      .then((result) => {
        watchedState.processState = 'requestSuccess';
        const { feed, postItems } = rssParser(result.data.contents);
        watchedState.data.feeds = [feed, ...watchedState.data.feeds];
        watchedState.feedUrls = [...watchedState.feedUrls, url];
        addPostsIfHaveUpdates(postItems, watchedState);
        watchedState.processState = 'newUrlAdded';
        if (!watchedState.updatePostsByTimer) {
          updatePostsByTimer(UPDATE_INTERVAL, watchedState);
          watchedState.updatePostsByTimer = true;
        }
      })
      .catch((error) => {
        watchedState.processState = 'requestFailed';
        watchedState.error = error.message;
      });
  };

  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const urlValue = formData.get('url');
    updateStateWithValidateUrl(urlValue)
    .then((url) => {
      proceedWithNewUrl(url);
    });
  });

  const postItemsGroup = document.querySelector('.posts');
  postItemsGroup.addEventListener('click', (e) => {
    const id = parseInt(e.target.dataset.id, 10);
    if (id && !watchedState.data.posts.opened.includes(id)) {
      watchedState.data.posts.opened = [id, ...watchedState.data.posts.opened];
    }
  });
  }
};

export default app;
