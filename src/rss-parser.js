import _ from 'lodash';

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('This source doesn\'t contain valid rss');
  }
  const title = doc.querySelector('channel > title').textContent;
  const description = doc.querySelector('channel > description').textContent;
  const items = doc.querySelectorAll('item');
  const id = _.uniqueId();
  const posts = [...items].reduce((acc, item, i) => {
    const postTitle = item.querySelector('title').textContent;
    const postDescription = item.querySelector('description').textContent;
    const postLink = item.querySelector('link').textContent;
    const postId = `${id}_${i}`;
    const postItem = {
      title: postTitle,
      description: postDescription,
      link: postLink,
      postId,
      feedId: id,
    };
    return [...acc, postItem];
  }, []);
  return {
    feed: {
      title,
      description,
      id,
    },
    posts,
  };
};
