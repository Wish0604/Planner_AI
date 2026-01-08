import { Octokit } from "@octokit/rest";

const REQUIRED_ENV = ["GITHUB_TOKEN", "GITHUB_REPO_OWNER", "GITHUB_REPO_NAME"];

const isDryRun = () => String(process.env.DRY_RUN || "false").toLowerCase() === "true";

export function assertGitHubConfig() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    const message = `Missing GitHub env vars: ${missing.join(", ")}`;
    console.warn(message);
    return { ok: false, message };
  }
  return { ok: true };
}

export class GitHubService {
  constructor() {
    const { ok } = assertGitHubConfig();
    if (!ok) {
      this.octokit = null;
      return;
    }

    this.owner = process.env.GITHUB_REPO_OWNER;
    this.repo = process.env.GITHUB_REPO_NAME;
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }

  isConfigured() {
    return Boolean(this.octokit && this.owner && this.repo);
  }

  async createIssue({ title, body, labels = [] }) {
    if (!this.isConfigured()) return { skipped: true, reason: "GitHub not configured" };
    if (isDryRun()) {
      console.log(`[DRY_RUN] Would create GitHub issue: ${title}`);
      return { skipped: true, dryRun: true, title, body, labels };
    }
    const { data } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      labels
    });
    return data;
  }

  async listOpenPullRequests({ staleDays = 7 } = {}) {
    if (!this.isConfigured()) return [];
    const { data } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: "open",
      per_page: 50,
      sort: "updated",
      direction: "asc"
    });

    const threshold = Date.now() - staleDays * 24 * 60 * 60 * 1000;
    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      updatedAt: pr.updated_at,
      isStale: new Date(pr.updated_at).getTime() < threshold,
      draft: pr.draft,
      author: pr.user?.login,
      labels: pr.labels?.map((l) => l.name) || [],
      mergeableState: pr.mergeable_state
    }));
  }

  async listFailingWorkflowRuns({ perPage = 20 } = {}) {
    if (!this.isConfigured()) return [];
    const { data } = await this.octokit.actions.listWorkflowRunsForRepo({
      owner: this.owner,
      repo: this.repo,
      per_page: perPage,
      status: "failure"
    });

    return data.workflow_runs.map((run) => ({
      id: run.id,
      name: run.name,
      url: run.html_url,
      headBranch: run.head_branch,
      conclusion: run.conclusion,
      status: run.status,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      attempt: run.run_attempt
    }));
  }

  async getRepoHealth({ staleDays = 7, failingRunThreshold = 2 } = {}) {
    if (!this.isConfigured()) {
      return {
        configured: false,
        blockers: ["GitHub integration not configured"],
        failingWorkflows: [],
        stalePullRequests: []
      };
    }

    const [failingWorkflows, pullRequests] = await Promise.all([
      this.listFailingWorkflowRuns(),
      this.listOpenPullRequests({ staleDays })
    ]);

    const stalePullRequests = pullRequests.filter((pr) => pr.isStale);

    const blockers = [];
    if (failingWorkflows.length >= failingRunThreshold) {
      blockers.push(`Detected ${failingWorkflows.length} failing workflow runs`);
    }
    if (stalePullRequests.length) {
      blockers.push(`${stalePullRequests.length} stale PRs (> ${staleDays} days)`);
    }

    return {
      configured: true,
      failingWorkflows,
      stalePullRequests,
      blockers,
      generatedAt: new Date().toISOString()
    };
  }
}

export const githubService = new GitHubService();
