export function paginate(posts, currentPage, postsPerPage) {
  const startIndex = (currentPage - 1) * postsPerPage;
  return posts.slice(startIndex, startIndex + postsPerPage);
}
