// @ts-check

import i18next from 'i18next';

const submit = document.querySelector('.rss-form .btn');
const inputUrl = document.querySelector('.form-control[name=url]');
const modalTitle = document.querySelector('.modal-title');
const modalBody = document.querySelector('.modal-body');
const modalLink = document.querySelector('.modal-footer a.btn');

const updateFeedback = (msg, type = 'success') => {
  const feedbackEl = document.querySelector('.feedback');
  feedbackEl.textContent = msg;
  if (msg) {
    const removedClass = `text-${type === 'success' ? 'danger' : 'success'}`;
    const addedClass = `text-${type}`;
    feedbackEl.classList.remove(removedClass);
    feedbackEl.classList.add(addedClass);
  } else {
    feedbackEl.classList.remove('text-danger', 'text-success');
  }
};

const renderFeeds = (feeds) => {
  const feedsContainer = document.querySelector('.feeds');
  feedsContainer.innerHTML = '';
  const feedsTitle = document.createElement('h2');
  feedsTitle.textContent = i18next.t('ui.feedsTitle');
  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group', 'mb-5');
  feeds.forEach(({ title, description }) => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item');
    const feedItemTitle = document.createElement('h3');
    feedItemTitle.textContent = title;
    const feedItemDescription = document.createElement('p');
    feedItemDescription.textContent = description;
    feedItem.appendChild(feedItemTitle);
    feedItem.appendChild(feedItemDescription);
    feedsList.appendChild(feedItem);
  });
  const fragment = document.createDocumentFragment();
  fragment.appendChild(feedsTitle);
  fragment.appendChild(feedsList);
  feedsContainer.appendChild(fragment);
};

const renderPosts = (posts, openedPostsIds) => {
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = '';
  const postsTitle = document.createElement('h2');
  postsTitle.textContent = i18next.t('ui.postsTitle');
  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');
  posts.forEach(({
    title, link, description,
  }, i) => {
    const id = posts.length - i;
    const postItem = document.createElement('li');
    postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const postItemLink = document.createElement('a');
    postItemLink.setAttribute('href', link);
    postItemLink.setAttribute('target', '_blank');
    postItemLink.setAttribute('rel', 'noopener noreferrer');
    postItemLink.dataset.id = id;
    const linkClass = openedPostsIds.includes(id) ? 'font-weight-normal' : 'font-weight-bold';
    postItemLink.classList.add(linkClass);
    postItemLink.textContent = title;
    const postItemButton = document.createElement('button');
    postItemButton.setAttribute('type', 'button');
    postItemButton.classList.add('btn', 'btn-primary', 'btn-sm');
    postItemButton.textContent = i18next.t('ui.previewButton');
    postItemButton.dataset.id = id;
    postItemButton.dataset.toggle = 'modal';
    postItemButton.dataset.target = '#modal';
    postItemButton.addEventListener('click', (e) => {
      e.preventDefault();
      modalTitle.textContent = title;
      modalBody.textContent = description;
      modalLink.setAttribute('href', link);
    });
    postItem.appendChild(postItemLink);
    postItem.appendChild(postItemButton);
    postsList.appendChild(postItem);
  });
  const fragment = document.createDocumentFragment();
  fragment.appendChild(postsTitle);
  fragment.appendChild(postsList);
  postsContainer.appendChild(fragment);
};

const processStateHandler = (state) => {
  switch (state) {
    case 'downloading':
      submit.disabled = true;
      break;
    case 'added':
      inputUrl.value = '';
      inputUrl.focus();
      updateFeedback(i18next.t('feedbackMessages.addedSuccessfully'), 'success');
      break;
    default:
      submit.disabled = false;
      break;
  }
};

export default (path, value, data) => {
  switch (path) {
    case 'form.valid':
      inputUrl.classList.toggle('is-invalid');
      break;
    case 'error':
      updateFeedback(value, 'danger');
      break;
    case 'processState':
      processStateHandler(value);
      break;
    case 'data.feeds':
      renderFeeds(value);
      break;
    case 'data.posts':
      renderPosts(value, data.openedPostsIds);
      break;
    case 'openedPostsIds':
      renderPosts(data.data.posts, value);
      break;
    default:
      break;
  }
};
