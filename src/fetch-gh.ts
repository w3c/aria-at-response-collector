import token from '../.github-access-token.json';

let limit: string | null = null;
let remaining: string | null = null;
let reset: string | null = null;
let used: string | null = null;

export default async (path: string): Promise<Response> => {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  limit = response.headers.get('x-ratelimit-limit');
  remaining = response.headers.get('x-ratelimit-remaining');
  reset = response.headers.get('x-ratelimit-reset');
  used = response.headers.get('x-ratelimit-used');

  return response;
};

export const rateLimitInfo = () => ({limit, remaining, reset, used});
