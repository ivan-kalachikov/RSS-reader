// @ts-check
import 'jquery';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
import uniqueId from 'lodash/uniqueId';
import differenceBy from 'lodash/differenceBy';
import view from './view.js';
import parseRss from './parse-rss.js';
import en from './locales/en.js';
import ru from './locales/ru.js';
import yupLocale from './locales/yup_locale.js';
import 'bootstrap/js/dist/modal.js';
import { proxyURL } from './constants/index.js';

const UPDATE_INTERVAL = 5000;

const app = () => {
  const userLocale = navigator.languages && navigator.languages.length
    ? navigator.languages[0]
    : navigator.language;
  const i18n = i18next.createInstance({ lng: userLocale });
  yup.setLocale(yupLocale);

  i18n.init({
    resources: {
      en,
      ru,
    },
  }).then(() => {
    const state = {
      form: {
        valid: true,
        error: null,
      },
      loadingProcess: {
        state: 'idle',
        error: null,
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
      const normalizedUrl = `${proxyURL}/?${encodedURI}`;
      return normalizedUrl;
    };

    const updatePosts = (url, feedId) => {
      axios.get(normalizeUrl(url))
        .then((response) => {
          const { posts } = parseRss(response.data);
          updateStateWithNewPosts(posts, feedId);
        })
        .catch(console.error)
        .finally(() => {
          setTimeout(() => {
            updatePosts(url, feedId);
          }, UPDATE_INTERVAL);
        });
    };

    const getAddFeedErrorKey = (error) => {
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
          const { feed, posts } = parseRss(response.data);
          const feedId = uniqueId();
          updateStateWithNewFeed(url, feed, feedId);
          updateStateWithNewPosts(posts, feedId);
          watchedState.loadingProcess.state = 'idle';
          setTimeout(() => {
            updatePosts(url, feedId);
          }, UPDATE_INTERVAL);
        }).catch((error) => {
          const errorKey = getAddFeedErrorKey(error);
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
      const urlValue = new FormData(e.target).get('url').trim();
      const validationError = validate(urlValue);
      watchedState.form.valid = true;
      if (validationError !== null) {
        watchedState.form.error = validationError.message;
        watchedState.form.valid = false;
      } else {
        watchedState.form.error = '';
        addNewFeed(urlValue);
      }
    });

    const postItemsGroup = document.querySelector('.posts');
    postItemsGroup.addEventListener('click', (e) => {
      const { id } = e.target.dataset;
      const isButton = e.target.classList.contains('btn');
      if (!watchedState.ui.openedPostsIds.includes(id)) {
        watchedState.ui.openedPostsIds = [id, ...watchedState.ui.openedPostsIds];
      }
      if (isButton) {
        watchedState.ui.modal = id;
      }
    });

    const copyToClipboardLink = document.querySelector('.copy-to-clipboard');
    copyToClipboardLink.addEventListener('click', (e) => {
      const { url } = e.target.dataset;
      navigator.clipboard.writeText(url);
    });
  });
};

export default app;
