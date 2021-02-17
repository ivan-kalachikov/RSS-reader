// @ts-check

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
  feedsTitle.textContent = 'Feeds';
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

const renderPosts = (posts) => {
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = '';
  const postsTitle = document.createElement('h2');
  postsTitle.textContent = 'Posts';
  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');
  posts.forEach(({
    title, link, description, postId,
  }) => {
    const postItem = document.createElement('li');
    postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const postItemLink = document.createElement('a');
    postItemLink.setAttribute('href', link);
    postItemLink.setAttribute('target', '_blank');
    postItemLink.setAttribute('rel', 'noopener noreferrer');
    postItemLink.dataset.id = postId;
    postItemLink.classList.add('font-weight-bold');
    postItemLink.textContent = title;
    const postItemButton = document.createElement('button');
    postItemButton.setAttribute('type', 'button');
    postItemButton.classList.add('btn', 'btn-primary', 'btn-sm');
    postItemButton.textContent = 'Preview';
    postItemButton.dataset.id = postId;
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
      updateFeedback('RSS added successfully', 'success');
      break;
    default:
      submit.disabled = false;
      break;
  }
};

export default (path, value) => {
  // console.log('path', path, 'value', value);
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
      renderPosts(value);
      break;
    default:
      break;
  }
};
