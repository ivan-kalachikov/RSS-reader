// @ts-check

import i18next from 'i18next';
import { renderFeeds, renderPosts, renderFeedback } from './render.js';

const submit = document.querySelector('.rss-form .btn');
const inputUrl = document.querySelector('.form-control[name=url]');

const processStateHandler = (state) => {
  switch (state) {
    case 'getting':
      submit.disabled = true;
      break;
    case 'newUrlAdded':
      inputUrl.value = '';
      inputUrl.focus();
      renderFeedback(i18next.t('feedbackMessages.newUrlAdded'), 'success');
      break;
    default:
      submit.disabled = false;
      break;
  }
};

export default (path, value, state) => {
  switch (path) {
    case 'form.valid':
      inputUrl.classList.toggle('is-invalid');
      break;
    case 'error':
      renderFeedback(value, 'danger');
      break;
    case 'processState':
      processStateHandler(value);
      break;
    case 'data.feeds':
      renderFeeds(value);
      break;
    case 'data.posts.items':
      renderPosts(value, state.data.posts.opened);
      break;
    case 'data.posts.opened':
      renderPosts(state.data.posts.items, value);
      break;
    default:
      break;
  }
};
