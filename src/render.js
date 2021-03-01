import i18next from 'i18next';

const modalTitle = document.querySelector('.modal-title');
const modalBody = document.querySelector('.modal-body');
const modalLink = document.querySelector('.modal-footer a.btn');
const feedsContainer = document.querySelector('.feeds');
const postsContainer = document.querySelector('.posts');
const feedbackEl = document.querySelector('.feedback');

const renderFeeds = (feeds) => {
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

const renderFeedback = (msg, type = 'success') => {
  if (!msg) {
    feedbackEl.classList.remove('danger', 'success');
    return;
  }
  feedbackEl.textContent = msg;
  const removedClass = `text-${type === 'success' ? 'danger' : 'success'}`;
  const addedClass = `text-${type}`;
  feedbackEl.classList.remove(removedClass);
  feedbackEl.classList.add(addedClass);
};

export { renderFeeds, renderPosts, renderFeedback };
