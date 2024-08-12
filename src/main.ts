import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const repository = "taikicoco/pr-label-slack-notifier";
const labels = ["bug", "documentation", "enhancement"];

interface PullRequest {
  number: number;
  title: string;
  assignees: { name: string }[];
  labels: { name: string }[];
}

async function sendSlackMessage(message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("SLACK_WEBHOOK_URL is not set");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Slack notification sent successfully");
  } catch (error) {
    console.error("Error sending Slack message:", error);
  }
}

async function getPullRequests() {
  const command = `gh pr list -R ${repository} --json number,title,assignees,labels`;

  try {
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error("Error:", stderr);
      return;
    }

    const pullRequests: PullRequest[] = JSON.parse(stdout);
    let slackMessage = "本日のPR状況:\n";

    labels.forEach((label) => {
      const filteredPRs = pullRequests.filter((pr) =>
        pr.labels.some((prLabel) => prLabel.name === label)
      );

      if (filteredPRs.length > 0) {
        slackMessage += `\n*${label} ラベルのPR:*\n`;
        slackMessage += "--------------------------------\n";
        filteredPRs.forEach((pr) => {
          const prUrl = `https://github.com/${repository}/pull/${pr.number}`;
          slackMessage += `• <${prUrl}|#${pr.number}: ${pr.title}>\n`;
          slackMessage += `  Labels: ${pr.labels
            .map((l) => l.name)
            .join(", ")}\n`;
          slackMessage += `  Assignees: ${
            pr.assignees.length > 0
              ? pr.assignees.map((a) => a.name).join(", ")
              : "None"
          }\n\n`;
        });
      } else {
        slackMessage += `\n*${label} ラベルのPRはありません*\n`;
      }
    });

    await sendSlackMessage(slackMessage);
    console.log("slackMessage:", slackMessage);
  } catch (error) {
    console.error("Error executing command:", error);
  }
}

getPullRequests();
