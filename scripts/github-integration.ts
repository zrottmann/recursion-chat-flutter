// GitHub Integration Service
// Handles repository creation, commits, and CI/CD setup

interface GitHubFile {
  path: string;
  content: string;
}

interface Repository {
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

export class GitHubIntegration {
  private baseUrl = 'https://api.github.com';
  private token: string;
  private owner: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
    this.owner = process.env.GITHUB_OWNER || 'zrottmann';
  }

  private async githubRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Create a new repository
  async createRepository(name: string, description: string = ''): Promise<Repository> {
    try {
      const data = await this.githubRequest('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          private: false,
          auto_init: true,
          gitignore_template: 'Node',
          license_template: 'mit'
        })
      });

      console.log(`Repository created: ${data.html_url}`);
      return data;
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }

  // Create multiple files in a single commit
  async commitFiles(repoName: string, files: GitHubFile[], message: string = 'AI-generated code') {
    try {
      // Get the latest commit SHA
      const { object: { sha: latestCommitSha } } = await this.githubRequest(
        `/repos/${this.owner}/${repoName}/git/ref/heads/main`
      );

      // Get the tree SHA of the latest commit
      const { tree: { sha: baseTreeSha } } = await this.githubRequest(
        `/repos/${this.owner}/${repoName}/git/commits/${latestCommitSha}`
      );

      // Create blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const blob = await this.githubRequest(
            `/repos/${this.owner}/${repoName}/git/blobs`,
            {
              method: 'POST',
              body: JSON.stringify({
                content: Buffer.from(file.content).toString('base64'),
                encoding: 'base64'
              })
            }
          );
          return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha
          };
        })
      );

      // Create a new tree
      const tree = await this.githubRequest(
        `/repos/${this.owner}/${repoName}/git/trees`,
        {
          method: 'POST',
          body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: blobs
          })
        }
      );

      // Create a new commit
      const commit = await this.githubRequest(
        `/repos/${this.owner}/${repoName}/git/commits`,
        {
          method: 'POST',
          body: JSON.stringify({
            message,
            tree: tree.sha,
            parents: [latestCommitSha]
          })
        }
      );

      // Update the reference
      await this.githubRequest(
        `/repos/${this.owner}/${repoName}/git/refs/heads/main`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            sha: commit.sha
          })
        }
      );

      console.log(`Files committed: ${commit.sha}`);
      return commit;
    } catch (error) {
      console.error('Error committing files:', error);
      throw error;
    }
  }

  // Create a GitHub Actions workflow for deployment
  async setupCICD(repoName: string, appwriteProjectId: string, siteId: string) {
    const workflowContent = `name: Deploy to Appwrite

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Appwrite Sites
        env:
          APPWRITE_API_KEY: \${{ secrets.APPWRITE_API_KEY }}
          APPWRITE_PROJECT_ID: ${appwriteProjectId}
          APPWRITE_SITE_ID: ${siteId}
        run: |
          npm install -g appwrite-cli
          appwrite client --endpoint https://nyc.cloud.appwrite.io/v1 \\
            --projectId $APPWRITE_PROJECT_ID \\
            --key $APPWRITE_API_KEY
          
          # Create deployment package
          tar -czf deploy.tar.gz dist/
          
          # Deploy to Appwrite Sites
          curl -X POST \\
            -H "X-Appwrite-Project: $APPWRITE_PROJECT_ID" \\
            -H "X-Appwrite-Key: $APPWRITE_API_KEY" \\
            -F "code=@deploy.tar.gz" \\
            "https://nyc.cloud.appwrite.io/v1/sites/$APPWRITE_SITE_ID/deployments"
`;

    await this.commitFiles(
      repoName,
      [{
        path: '.github/workflows/deploy.yml',
        content: workflowContent
      }],
      'Add CI/CD workflow for Appwrite deployment'
    );

    console.log('CI/CD workflow created');
    return true;
  }

  // Create a pull request
  async createPullRequest(repoName: string, branchName: string, title: string, body: string = '') {
    try {
      const pr = await this.githubRequest(
        `/repos/${this.owner}/${repoName}/pulls`,
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            body,
            head: branchName,
            base: 'main'
          })
        }
      );

      console.log(`Pull request created: ${pr.html_url}`);
      return pr;
    } catch (error) {
      console.error('Error creating pull request:', error);
      throw error;
    }
  }

  // Merge a pull request
  async mergePullRequest(repoName: string, pullNumber: number) {
    try {
      const result = await this.githubRequest(
        `/repos/${this.owner}/${repoName}/pulls/${pullNumber}/merge`,
        {
          method: 'PUT',
          body: JSON.stringify({
            commit_title: 'Merge AI-generated code',
            merge_method: 'squash'
          })
        }
      );

      console.log(`Pull request #${pullNumber} merged`);
      return result;
    } catch (error) {
      console.error('Error merging pull request:', error);
      throw error;
    }
  }

  // Trigger a workflow
  async triggerWorkflow(repoName: string, workflowFile: string = 'deploy.yml') {
    try {
      const result = await this.githubRequest(
        `/repos/${this.owner}/${repoName}/actions/workflows/${workflowFile}/dispatches`,
        {
          method: 'POST',
          body: JSON.stringify({
            ref: 'main'
          })
        }
      );

      console.log(`Workflow ${workflowFile} triggered`);
      return true;
    } catch (error) {
      console.error('Error triggering workflow:', error);
      throw error;
    }
  }

  // Get workflow runs
  async getWorkflowRuns(repoName: string) {
    try {
      const runs = await this.githubRequest(
        `/repos/${this.owner}/${repoName}/actions/runs`
      );

      return runs.workflow_runs;
    } catch (error) {
      console.error('Error getting workflow runs:', error);
      throw error;
    }
  }

  // Create a basic package.json file
  private createPackageJson(projectName: string, projectType: string) {
    const dependencies: Record<string, string> = {
      'next': '^15.0.0',
      'react': '^19.0.0',
      'react-dom': '^19.0.0'
    };

    if (projectType === 'api' || projectType === 'backend') {
      dependencies['express'] = '^4.18.0';
      dependencies['cors'] = '^2.8.5';
    }

    return JSON.stringify({
      name: projectName,
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies,
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        'typescript': '^5.0.0'
      }
    }, null, 2);
  }

  // Initialize a repository with basic structure
  async initializeRepository(repoName: string, projectType: string, files: GitHubFile[] = []) {
    const baseFiles: GitHubFile[] = [
      {
        path: 'package.json',
        content: this.createPackageJson(repoName, projectType)
      },
      {
        path: 'README.md',
        content: `# ${repoName}

AI-generated project created by the AI Development Orchestrator.

## Project Type
${projectType}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment

This project is configured for automatic deployment to Appwrite Sites.

## Generated by
AI Development Orchestrator - Powered by Grok and Claude Code
`
      },
      {
        path: '.gitignore',
        content: `node_modules/
.next/
dist/
.env.local
.env
*.log
.DS_Store
`
      }
    ];

    // Add provided files
    const allFiles = [...baseFiles, ...files];

    // Commit all files
    await this.commitFiles(repoName, allFiles, 'Initialize project structure');

    return true;
  }
}

// Export singleton instance
export const githubIntegration = new GitHubIntegration();