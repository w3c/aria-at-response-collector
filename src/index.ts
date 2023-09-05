import createServer from './server';
import GITHUB_API_DOMAIN from './github-api-domain';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

if (GITHUB_API_DOMAIN !== 'https://api.github.com') {
  (async () => {
    const start = (await import('../test/mock-github-server')).default;

    start(GITHUB_API_DOMAIN, port);
  })();
}

const server = createServer();

server.listen(port).then(() => {
  console.log(`server started at http://localhost:${port}`);
});
