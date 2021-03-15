// @ts-check

import i18next from 'i18next';
import { renderFeeds, renderPosts, renderFeedback } from './render.js';

const processStateHandler = (processState) => {
  const submit = document.querySelector('.rss-form .btn');
  const inputUrl = document.querySelector('.form-control[name=url]');
  submit.disabled = false;
  inputUrl.readOnly = false;
  switch (processState) {
    case 'addFeedUrl':
      inputUrl.classList.remove('is-invalid');
      submit.disabled = true;
      inputUrl.readOnly = true;
      break;
    case 'formValidationError':
      inputUrl.classList.add('is-invalid');
      break;
    case 'requestSuccess':
      inputUrl.value = '';
      inputUrl.focus();
      renderFeedback(i18next.t('feedbackMessages.newUrlAdded'), 'success');
      break;
    case 'requestFailed':
      break;
    case 'error':
      break;
    default:
      throw new Error('Unknown status');
  }
};

export default (path, value, state) => {
  switch (path) {
    case 'data.feeds':
      renderFeeds(value);
      break;
    case 'data.posts':
      renderPosts(value, state.ui.openedPosts);
      break;
    case 'ui.openedPosts':
      renderPosts(state.data.posts, value);
      break;
    case 'processState.name':
      processStateHandler(value);
      break;
    case 'processState.errors':
      renderFeedback(value, 'danger');
      break;
    default:
      break;
  }
};
