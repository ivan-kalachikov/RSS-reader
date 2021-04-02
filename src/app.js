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
import yupLocale from './locales/yup_locale.js';

const UPDATE_INTERVAL = 5000;

const app = () => {
  const i18n = i18next.createInstance();
  yup.setLocale(yupLocale);

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
        modal: {},
      },
    };

    const watchedState = onChange(state, (path, value) => {
      view(path, value, state, i18n);
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

    const normalizeUrl = (url) => {
      const encodedURI = encodeURIComponent(url);
      const normalizedUrl = `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodedURI}`;
      return normalizedUrl;
    };

    const updatePosts = (url) => {
      axios.get(normalizeUrl(url))
        .then((response) => {
          const { posts } = parseRss(response.data.contents);
          updateStateWithNewPosts(posts);
        })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            updatePosts(url);
          }, UPDATE_INTERVAL);
        });
    };

    const addNewFeed = (url) => {
      watchedState.loadingProcess.error = '';
      watchedState.loadingProcess.state = 'fetching';
      axios.get(normalizeUrl(url))
        .then((response) => {
          const parsingErrorMessage = i18n.t('feedbackMessages.invalidRSS');
          const { feed, posts } = parseRss(response.data.contents, parsingErrorMessage);
          updateStateWithNewFeed(url, feed);
          updateStateWithNewPosts(posts);
          watchedState.loadingProcess.state = 'idle';
          setTimeout(() => {
            updatePosts(url);
          }, UPDATE_INTERVAL);
        }).catch((error) => {
          const isNetworkError = error.request !== undefined;
          watchedState.loadingProcess.error = isNetworkError ? i18n.t('feedbackMessages.networkError') : error.message;
          watchedState.loadingProcess.state = 'error';
        });
    };

    const validate = (value) => {
      const feedUrls = _.map(watchedState.data.feeds, 'url');
      const schema = yup.string().required().url().notOneOf(feedUrls);
      try {
        schema.validateSync(value);
        return null;
      } catch (err) {
        return err;
      }
    };

    const form = document.querySelector('.rss-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const urlValue = new FormData(e.target).get('url');
      const validationError = validate(urlValue);
      if (validationError !== null) {
        const errorKeys = validationError.errors;
        const errorMsg = errorKeys.map((key) => i18n.t(key)).join('\n');
        watchedState.form.error = errorMsg;
        watchedState.form.valid = false;
      } else {
        watchedState.form.valid = true;
        watchedState.form.error = '';
        addNewFeed(urlValue);
      }
    });

    const postItemsGroup = document.querySelector('.posts');
    postItemsGroup.addEventListener('click', (e) => {
      const { id } = e.target.dataset;
      if (!watchedState.ui.openedPostsIds.includes(id)) {
        watchedState.ui.openedPostsIds = [id, ...watchedState.ui.openedPostsIds];
      }
    });

    postItemsGroup.addEventListener('click', (e) => {
      const isButton = e.target.classList.contains('btn');
      if (isButton) {
        const postId = e.target.dataset.id;
        const post = state.data.posts.find(({ id }) => postId === id);
        watchedState.ui.modal = post;
      }
    });
  });
};

export default app;
