import token from '../.github-access-token.json';

export default (path: string): Promise<Response> => {
  return fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
};
