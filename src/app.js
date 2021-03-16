// @ts-check
import 'jquery';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
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
          networkError: 'Ошибка сети',
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
  const state = {
    processState: {
      name: '',
      errors: '',
      updatePostsTimer: false,
    },
    data: {
      feeds: [],
      posts: [],
    },
    ui: {
      openedPosts: [],
    },
  };

  const watchedState = onChange(state, (path, value) => {
    view(path, value, onChange.target(watchedState));
  });

  const updateStateWithValidation = (url) => {
    const feedUrls = _.map(watchedState.data.feeds, 'url');
    const schema = yup.string().required().url().notOneOf(feedUrls);
    return schema.validate(url)
      .then(() => {
        watchedState.processState.name = 'addFeedUrl';
        watchedState.processState.errors = '';
        return url;
      })
      .catch((error) => {
        watchedState.processState.name = 'formValidationError';
        throw new Error(error.message);
      });
  };

  const generateUrl = (url) => {
    const encodedURI = encodeURIComponent(url);
    return `https://hexlet-allorigins.herokuapp.com/get?url=${encodedURI}&disableCache=true`;
  };

  const getDataFromUrl = (url) => axios.get(generateUrl(url))
    .then((response) => {
      watchedState.processState.name = 'requestSuccess';
      return Promise.resolve(response);
    })
    .catch(() => {
      watchedState.processState.name = 'requestFailed';
      throw new Error(i18next.t('feedbackMessages.networkError'));
    });

  const updateStateWithNewFeed = ((data, url) => {
    watchedState.processState.name = 'feedAdded';
    const newFeed = { url, data: data.feed };
    watchedState.data.feeds = [newFeed, ...watchedState.data.feeds];
    return Promise.resolve(data);
  });

  const updateStateWithNewPosts = ((posts) => {
    const existPosts = watchedState.data.posts;
    const newPosts = _.differenceWith(posts, existPosts, _.isEqual);
    if (newPosts.length) {
      watchedState.data.posts = [...newPosts, ...existPosts];
    }
    return Promise.resolve(newPosts.length > 0);
  });

  const updatePostsByTimer = (interval) => {
    watchedState.processState.updatePostsTimer = true;
    setTimeout(() => {
      const feedUrls = _.map(watchedState.data.feeds, 'url');
      const promises = feedUrls.map((url) => axios.get(generateUrl(url)));
      const postsRequests = Promise.allSettled(promises);
      return postsRequests
        .then((results) => {
          const receivedPosts = results.map(
            (result) => rssParser(result.value.data.contents).posts,
          );
          updateStateWithNewPosts(_.flattenDeep(receivedPosts));
        })
        .finally(() => {
          updatePostsByTimer(interval);
        });
    }, interval);
  };

  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlValue = new FormData(e.target).get('url');
    updateStateWithValidation(urlValue)
      .then((url) => url && getDataFromUrl(url))
      .then((response) => response && rssParser(response.data.contents))
      .then((data) => data && updateStateWithNewFeed(data, urlValue))
      .then((data) => data && updateStateWithNewPosts(data.posts))
      .then((postAdded) => (
        !watchedState.processState.updatePostsTimer
        && postAdded && updatePostsByTimer(UPDATE_INTERVAL)
      ))
      .catch((error) => {
        watchedState.processState.name = 'error';
        watchedState.processState.errors = error.message;
      });
  });

  const postItemsGroup = document.querySelector('.posts');
  postItemsGroup.addEventListener('click', (e) => {
    const id = parseInt(e.target.dataset.id, 10);
    if (id && !watchedState.ui.openedPosts.includes(id)) {
      watchedState.ui.openedPosts = [id, ...watchedState.ui.openedPosts];
    }
  });
};

export default app;
