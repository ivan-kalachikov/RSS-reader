// @ts-check

import {
  renderModal, renderFeeds, renderPosts, renderFeedback,
} from './render.js';

const loadingProcessStateHandler = (loadingProcessState, state, i18n) => {
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
      renderFeedback('feedbackMessages.newUrlAdded', i18n, 'success');
      break;
    case 'error':
      submit.disabled = false;
      inputUrl.readOnly = false;
      renderFeedback(state.loadingProcess.error, i18n, 'danger');
      break;
    default:
      throw new Error(`Unknown status ${loadingProcessState}`);
  }
};

export default (path, value, state, i18n) => {
  const inputUrl = document.querySelector('.form-control[name=url]');
  switch (path) {
    case 'form.valid':
      inputUrl.classList.toggle('is-invalid');
      renderFeedback(state.form.error, i18n, 'danger');
      break;
    case 'loadingProcess.state':
      loadingProcessStateHandler(value, state, i18n);
      break;
    case 'data.feeds':
      renderFeeds(value, i18n);
      break;
    case 'data.posts':
      renderPosts(value, state.ui.openedPostsIds, i18n);
      break;
    case 'ui.openedPostsIds':
      renderPosts(state.data.posts, value, i18n);
      break;
    case 'ui.modal':
      renderModal(state.data.posts.find(({ id }) => value === id));
      break;
    default:
      break;
  }
};
