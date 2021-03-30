// @ts-check

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
      renderFeedback(state.ui.i18next.t('feedbackMessages.newUrlAdded'), 'success');
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
      renderFeeds(value, state.ui.i18next);
      break;
    case 'data.posts':
      renderPosts(value, state.ui.openedPostsIds, state.ui.i18next);
      break;
    case 'ui.openedPostsIds':
      renderPosts(state.data.posts, value, state.ui.i18next);
      break;
    case 'form.valid':
      inputUrl.classList.toggle('is-invalid');
      renderFeedback(state.form.error, 'danger');
      break;
    default:
      break;
  }
};
