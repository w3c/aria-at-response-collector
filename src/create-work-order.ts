import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const WORK_ORDERS_BRANCH = 'work-orders';

const makeGit = (cwd: string) => {
  return async (args: string[], options = {}) => {
    const child = spawn('git', args, {cwd, ...options});
    await new Promise<void>((resolve, reject) => {
      child.on('close', (code) => {
        if (code != 0) {
          reject();
        }
        resolve();
      });
    });
  };
};

export default async () => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'repo-'));
  const git = makeGit(dir);

  try {
    await git(['clone', 'git@github.com:bocoup/aria-at-gh-actions-helper.git', '--branch', WORK_ORDERS_BRANCH, '--depth', '1', '.']);
    await git(['commit', '--allow-empty', '--message', 'things\n\nand stuff']);
    await git(['push', 'origin', WORK_ORDERS_BRANCH]);
  } finally {
    await fs.rm(dir, {recursive: true});
  }
};
