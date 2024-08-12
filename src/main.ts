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
  const Repository = "taikicoco/pr-label-slack-notifier";
  const labels = ["bug", "documentation", "enhancement"];

  const command =
    "gh pr list -R " + Repository + " --json number,title,assignees,labels";

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
          console.log(`  PR #${pr.number}: ${pr.title}`);
          console.log(`    Labels: ${pr.labels.map((l) => l.name).join(", ")}`);
          console.log(`    Title: ${pr.title}`);
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
