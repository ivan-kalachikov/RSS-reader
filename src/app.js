// @ts-check
import 'jquery';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
import _ from 'lodash';
import view from './view.js';
import parseRss from './parse-rss.js';

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
    form: {
      valid: true,
      error: '',
    },
    loadingProcess: {
      state: 'idle',
      error: '',
    },
    data: {
      feeds: [],
      posts: [],
    },
    ui: {
      openedPostsIds: [],
    },
  };

  const watchedState = onChange(state, (path, value) => {
    view(path, value, state);
  });

  const updateStateWithNewFeed = ((url, feed) => {
    if (!watchedState.data.feeds.some(({ url: itemUrl }) => itemUrl === url)) {
      watchedState.data.feeds = [{ url, data: feed }, ...watchedState.data.feeds];
    }
  });

  const updateStateWithNewPosts = ((posts) => {
    const existPosts = watchedState.data.posts;
    const newPosts = _.differenceWith(posts, existPosts, _.isEqual);
    if (newPosts.length) {
      watchedState.data.posts = [...newPosts, ...existPosts];
    }
  });

  const getRawData = (url) => {
    const encodedURI = encodeURIComponent(url);
    const normalizedUrl = `https://hexlet-allorigins.herokuapp.com/get?url=${encodedURI}&disableCache=true`;
    return axios.get(normalizedUrl)
      .catch((error) => {
        if (error.request) {
          throw new Error(i18next.t('feedbackMessages.networkError'));
        } else {
          throw error;
        }
      });
  };

  const getDataAndUpdate = (url) => getRawData(url)
    .then((response) => {
      const { feed, posts } = parseRss(response.data.contents);
      updateStateWithNewFeed(url, feed);
      updateStateWithNewPosts(posts);
      setTimeout(() => {
        getDataAndUpdate(url);
      }, UPDATE_INTERVAL);
    });

  const addUrlHandler = (url) => {
    const feedUrls = _.map(watchedState.data.feeds, 'url');
    const schema = yup.string().required().url().notOneOf(feedUrls);
    watchedState.form.valid = true;
    schema.validate(url)
      .then(() => {
        watchedState.loadingProcess.error = '';
        watchedState.loadingProcess.state = 'fetching';
        watchedState.form.error = '';
        return getDataAndUpdate(url);
      })
      .then(() => {
        watchedState.loadingProcess.state = 'idle';
      })
      .catch((error) => {
        if (error.name === 'ValidationError') {
          watchedState.form.error = error.message;
          watchedState.form.valid = false;
        } else {
          watchedState.loadingProcess.error = error.message;
          watchedState.loadingProcess.state = 'error';
        }
      });
  };

  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlValue = new FormData(e.target).get('url');
    addUrlHandler(urlValue);
  });

  const postItemsGroup = document.querySelector('.posts');
  postItemsGroup.addEventListener('click', (e) => {
    const { id } = e.target.dataset;
    if (id && !watchedState.ui.openedPostsIds.includes(id)) {
      watchedState.ui.openedPostsIds = [id, ...watchedState.ui.openedPostsIds];
    }
  });
};

export default app;
