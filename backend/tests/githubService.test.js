import test from 'node:test';
import assert from 'node:assert/strict';

import { GitHubService, assertGitHubConfig } from '../services/githubService.js';

const originalEnv = { ...process.env };

function withEnv(tempEnv, fn) {
  const previous = { ...process.env };
  Object.assign(process.env, tempEnv);
  try {
    return fn();
  } finally {
    process.env = previous;
  }
}

// Ensure missing envs are surfaced
 test('assertGitHubConfig reports missing env vars', () => {
  withEnv({ GITHUB_TOKEN: '', GITHUB_REPO_OWNER: '', GITHUB_REPO_NAME: '' }, () => {
    const result = assertGitHubConfig();
    assert.equal(result.ok, false);
    assert.match(result.message, /Missing GitHub env vars/);
  });
});

// Dry run should not call GitHub and should mark skipped
 test('createIssue respects DRY_RUN', async () => {
  await withEnv({
    GITHUB_TOKEN: 'fake-token',
    GITHUB_REPO_OWNER: 'fake-owner',
    GITHUB_REPO_NAME: 'fake-repo',
    DRY_RUN: 'true'
  }, async () => {
    const svc = new GitHubService();
    const res = await svc.createIssue({ title: 't', body: 'b', labels: ['x'] });
    assert.equal(res.dryRun, true);
    assert.equal(res.skipped, true);
  });
});
