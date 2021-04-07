// @ts-check
import 'jquery';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
import { differenceBy, uniqueId } from 'lodash';
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

    const updateStateWithNewFeed = (url, feed, id) => {
      watchedState.data.feeds = [{ id, url, data: feed }, ...watchedState.data.feeds];
    };

    const updateStateWithNewPosts = (posts, feedId) => {
      const existPosts = watchedState.data.posts;
      const existPostsByFeed = existPosts.filter(({ feedId: postFeedId }) => feedId === postFeedId);
      const newPosts = differenceBy(posts, existPostsByFeed, 'title');
      if (newPosts.length) {
        const newPostsWithIds = newPosts.map((post) => ({ ...post, feedId, id: uniqueId() }));
        watchedState.data.posts = [...newPostsWithIds, ...existPosts];
      }
    };

    const normalizeUrl = (url) => {
      const encodedURI = encodeURIComponent(url);
      const normalizedUrl = `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodedURI}`;
      return normalizedUrl;
    };

    const updatePosts = (url, feedId) => {
      axios.get(normalizeUrl(url))
        .then((response) => {
          const { posts } = parseRss(response.data.contents);
          updateStateWithNewPosts(posts, feedId);
        })
        .catch(console.log)
        .finally(() => {
          setTimeout(() => {
            updatePosts(url, feedId);
          }, UPDATE_INTERVAL);
        });
    };

    const getAddingErrorKey = (error) => {
      if (error.isParseError) {
        return 'feedbackMessages.invalidRSS';
      }
      if (error.isAxiosError) {
        return 'feedbackMessages.networkError';
      }
      return { key: 'feedbackMessages.unknownError', error };
    };

    const addNewFeed = (url) => {
      watchedState.loadingProcess.error = '';
      watchedState.loadingProcess.state = 'fetching';
      axios.get(normalizeUrl(url))
        .then((response) => {
          const { feed, posts } = parseRss(response.data.contents);
          const feedId = uniqueId();
          updateStateWithNewFeed(url, feed, feedId);
          updateStateWithNewPosts(posts, feedId);
          watchedState.loadingProcess.state = 'idle';
          setTimeout(() => {
            updatePosts(url, feedId);
          }, UPDATE_INTERVAL);
        }).catch((error) => {
          const errorKey = getAddingErrorKey(error);
          watchedState.loadingProcess.error = errorKey;
          watchedState.loadingProcess.state = 'error';
        });
    };

    const validate = (value) => {
      const feedUrls = watchedState.data.feeds.map(({ url }) => url);
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
        watchedState.form.error = validationError.message;
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
        watchedState.ui.modal = postId;
      }
    });
  });
};

export default app;
