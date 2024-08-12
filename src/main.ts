import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface PullRequest {
  number: number;
  title: string;
  assignees: { name: string }[];
  labels: { name: string }[];
}

async function getPullRequests() {
  const repository = "taikicoco/pr-label-slack-notifier";
  const labels = ["bug", "documentation", "enhancement"];

  const command =
    `gh pr list -R ${repository} --json number,title,assignees,labels`;

  try {
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error("Error:", stderr);
      return;
    }

    const pullRequests: PullRequest[] = JSON.parse(stdout);

    labels.forEach((label) => {
      const filteredPRs = pullRequests.filter((pr) =>
        pr.labels.some((prLabel) => prLabel.name === label)
      );

      if (filteredPRs.length > 0) {
        console.log(`\nPull Requests with label "${label}":`);
        filteredPRs.forEach((pr) => {
          const prUrl = `https://github.com/${repository}/pull/${pr.number}`;
          console.log(`  PR #${pr.number}: ${pr.title}`);
          console.log(`    URL: ${prUrl}`);
          console.log(`    Labels: ${pr.labels.map((l) => l.name).join(", ")}`);
          console.log(
            `    Assignees: ${
              pr.assignees.length > 0
                ? pr.assignees.map((a) => a.name).join(", ")
                : "None"
            }`
          );
          console.log("  ---");
        });
      } else {
        console.log(`\nNo Pull Requests found with label "${label}"`);
      }
    });
  } catch (error) {
    console.error("Error executing command:", error);
  }
}

getPullRequests();