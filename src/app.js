// @ts-check
import 'jquery';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
import _ from 'lodash';
import view from './view.js';
import parseRss from './parse-rss.js';
import ru from './locales/ru.js';

const UPDATE_INTERVAL = 5000;

const app = () => {
  const i18n = i18next.createInstance();
  i18n.init({
    lng: 'ru',
    resources: {
      ru,
    },
  }).then(() => {
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
        i18n,
      },
    };

    const watchedState = onChange(state, (path, value) => {
      view(path, value, state);
    });

    yup.setLocale({
      mixed: {
        notOneOf: watchedState.ui.i18n.t('feedbackMessages.alreadyExistRSS'),
      },
      string: {
        url: watchedState.ui.i18n.t('feedbackMessages.invalidURL'),
      },
    });

    const updateStateWithNewFeed = ((url, feed) => {
      watchedState.data.feeds = [{ url, data: feed }, ...watchedState.data.feeds];
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
      return axios.get(normalizedUrl);
    };

    const updatePosts = (url) => {
      getRawData(url)
        .then((response) => {
          const { posts } = parseRss(response.data.contents);
          updateStateWithNewPosts(posts);
        })
        .finally(() => {
          setTimeout(() => {
            updatePosts(url);
          }, UPDATE_INTERVAL);
        });
    };

    const addNewFeed = (url) => {
      getRawData(url)
        .then((response) => {
          const { feed, posts } = parseRss(response.data.contents, watchedState.ui.i18n.t('feedbackMessages.invalidRSS'));
          updateStateWithNewFeed(url, feed);
          updateStateWithNewPosts(posts);
          watchedState.loadingProcess.state = 'idle';
          updatePosts(url);
        }).catch((error) => {
          const isNetworkError = error.request !== undefined;
          watchedState.loadingProcess.error = isNetworkError ? watchedState.ui.i18n.t('feedbackMessages.networkError') : error.message;
          watchedState.loadingProcess.state = 'error';
        });
    };

    const validateAndProceedWithData = (url) => {
      const feedUrls = _.map(watchedState.data.feeds, 'url');
      const schema = yup.string().required().url().notOneOf(feedUrls);
      try {
        schema.validateSync(url);
        watchedState.form.valid = true;
        watchedState.form.error = '';
        watchedState.loadingProcess.error = '';
        watchedState.loadingProcess.state = 'fetching';
        addNewFeed(url);
      } catch (error) {
        watchedState.form.error = error.message;
        watchedState.form.valid = false;
      }
    };

    const form = document.querySelector('.rss-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const urlValue = new FormData(e.target).get('url');
      validateAndProceedWithData(urlValue);
    });

    const postItemsGroup = document.querySelector('.posts');
    postItemsGroup.addEventListener('click', (e) => {
      const { id } = e.target.dataset;
      if (!watchedState.ui.openedPostsIds.includes(id)) {
        watchedState.ui.openedPostsIds = [id, ...watchedState.ui.openedPostsIds];
      }
    });
  });
};

export default app;
