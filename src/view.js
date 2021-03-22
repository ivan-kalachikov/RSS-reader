// @ts-check

import i18next from 'i18next';
import { renderFeeds, renderPosts, renderFeedback } from './render.js';

const loadingProcessStateHandler = (loadingProcessState, state) => {
  const inputUrl = document.querySelector('.form-control[name=url]');
  const submit = document.querySelector('.rss-form .btn');
  switch (loadingProcessState) {
    case 'fetching':
      submit.disabled = true;
      inputUrl.readOnly = true;
      break;
    case 'idle':
      submit.disabled = false;
      inputUrl.readOnly = false;
      inputUrl.value = '';
      inputUrl.focus();
      renderFeedback(i18next.t('feedbackMessages.newUrlAdded'), 'success');
      break;
    case 'error':
      submit.disabled = false;
      inputUrl.readOnly = false;
      renderFeedback(state.loadingProcess.error, 'danger');
      break;
    default:
      throw new Error(`Unknown status ${loadingProcessState}`);
  }
};

export default (path, value, state) => {
  const inputUrl = document.querySelector('.form-control[name=url]');
  switch (path) {
    case 'loadingProcess.state':
      loadingProcessStateHandler(value, state);
      break;
    case 'data.feeds':
      renderFeeds(value);
      break;
    case 'data.posts':
      renderPosts(value, state.ui.openedPostsIds);
      break;
    case 'ui.openedPostsIds':
      renderPosts(state.data.posts, value);
      break;
    case 'form.valid':
      inputUrl.classList.toggle('is-invalid');
      renderFeedback(state.form.error, 'danger');
      break;
    default:
      break;
  }
};
