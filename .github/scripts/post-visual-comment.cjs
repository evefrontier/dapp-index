#!/usr/bin/env node
// Find-or-create-or-update the Playwright visual-regression PR comment.
// Invoked by actions/github-script in the site-visual CI job.
//
// Required env vars:
//   COMMENT_BODY_PATH  Path to the rendered markdown comment body.
const fs = require('node:fs');

const MARKER = '<!-- playwright-visual-regression -->';
const BOT_LOGIN = 'github-actions[bot]';

/** @param {{ github: import('@actions/github').GitHub; context: import('@actions/github').Context; core: import('@actions/core').Core }} params */
module.exports = async ({ github, context, core }) => {
  const bodyPath = process.env.COMMENT_BODY_PATH;
  if (!bodyPath) {
    throw new Error('COMMENT_BODY_PATH is required');
  }

  const body = fs.readFileSync(bodyPath, 'utf8');
  const issueNumber = context.issue.number;
  const { owner, repo } = context.repo;

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });

  const existing = comments.find(
    (comment) =>
      comment.user?.login === BOT_LOGIN && comment.body?.includes(MARKER),
  );

  if (existing) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    core.info(`Updated visual-regression comment id ${existing.id}.`);
    return;
  }

  const created = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
  core.info(`Created visual-regression comment id ${created.data.id}.`);
};
