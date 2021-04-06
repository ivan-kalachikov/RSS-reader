export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');

  if (doc.querySelector('parsererror')) {
    const parseError = new Error('rss parsererror');
    parseError.isParseError = true;
    throw parseError;
  }

  const title = doc.querySelector('channel > title').textContent;
  const description = doc.querySelector('channel > description').textContent;
  const feed = { title, description };

  const postElements = doc.querySelectorAll('item');
  const posts = [...postElements].reduce((acc, item) => {
    const postTitle = item.querySelector('title').textContent;
    const postDescription = item.querySelector('description').textContent;
    const postLink = item.querySelector('link').textContent;
    const postItem = {
      title: postTitle,
      description: postDescription,
      link: postLink,
    };
    return [...acc, postItem];
  }, []);

  return { feed, posts };
};
