import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const WORK_ORDERS_REMOTE = 'git@github.com:bocoup/aria-at-response-collector.git';
const WORK_ORDERS_BRANCH = 'work-orders';

const makeGit = (cwd: string) => {
  return (args: string[], options = {}) => {
    const child = spawn('git', args, {cwd, ...options});
    let out = '';
    let error = '';

    child.stdout.on('data', (chunk) => out += chunk);
    child.stderr.on('data', (chunk) => error += chunk);

    return new Promise<string>((resolve, reject) => {
      child.on('close', (code) => {
        code === 0 ? resolve(out) : reject(error);
      });
    });
  };
};

interface WorkflowRun {
  id: string,
}

// https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository
const getWorkflowRuns = async (headSha: string): Promise<WorkflowRun[]> => {
  const response = await fetch(
    `https://api.github.com/repos/bocoup/aria-at-response-collector/actions/runs?head_sha=${headSha}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to retrieve Workflow Runs for SHA ${headSha}: "${await response.text()}"`
    );
  }

  const body = await response.json();

  if (!body || !('workflow_runs' in body)) {
    throw new Error(`Unrecognized response: ${JSON.stringify(body)}`);
  }

  return body.workflow_runs;
};

const POLL_TIMEOUT = 30 * 1000; // 30 seconds
const POLL_PERIOD = 500; // one half of one second

const pollForWorkflowRun = async (headSha: string) => {
  const timeout = new Promise<WorkflowRun[]>((_, reject) => {
      setTimeout(
        () => reject(`Timed out waiting for a Workflow Run for SHA ${headSha}`),
        POLL_TIMEOUT
      );
  });

  while (true) {
    const workflowRuns = await Promise.race([getWorkflowRuns(headSha), timeout]);

    if (workflowRuns.length === 1) {
      return workflowRuns[0].id;
    } else if (workflowRuns.length > 1) {
      const ids = workflowRuns
        .map((run) => run.id)
        .join(', ');
      throw new Error(
        `Expected one Workflow Run for SHA ${headSha} but found ${workflowRuns.length}. IDs: ${ids}`
      );
    }

    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, POLL_PERIOD)),
      timeout,
    ]);
  }
};

export default async () => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'repo-'));
  const git = makeGit(dir);

  let headSha = '';

  try {
    await git(['clone', WORK_ORDERS_REMOTE, '--branch', WORK_ORDERS_BRANCH, '--depth', '1', '.']);
    await git(['commit', '--allow-empty', '--message', 'things\n\nand stuff']);
    headSha = await git(['rev-parse', 'HEAD']);
    await git(['push', 'origin', WORK_ORDERS_BRANCH]);
  } finally {
    await fs.rm(dir, {recursive: true});
  }

  return pollForWorkflowRun(headSha);
};
