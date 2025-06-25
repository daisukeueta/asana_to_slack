# Asana to Slack Task Notifier

A TypeScript-based automation tool that fetches tasks from Asana projects and posts daily updates to Slack channels. This script helps teams stay informed about their task status by automatically sharing TODO and In-Progress items.

## Core Feature

This script automatically retrieves tasks from specified Asana project sections (To-Do and In Progress), filters out subtasks to show only parent tasks, sorts them by due date, and posts a formatted summary to a designated Slack channel. It's designed to run daily via GitHub Actions or can be executed manually.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/asana_to_slack.git
cd asana_to_slack
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables template:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your credentials:
```
ASANA_ACCESS_TOKEN=your-asana-personal-access-token
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
ASANA_PROJECT_ID=your-asana-project-id
SLACK_CHANNEL_ID=your-slack-channel-id
```

### Setting up Asana

1. Go to Asana Settings → Apps → Create Personal Access Token
2. Copy the generated token to `ASANA_ACCESS_TOKEN`
3. Find your project ID from the Asana project URL (e.g., `https://app.asana.com/0/1234567890/list` → `1234567890`)

### Setting up Slack

1. Create a new Slack App at https://api.slack.com/apps
2. Add OAuth Scopes: `chat:write` and `chat:write.public`
3. Install the app to your workspace
4. Copy the Bot User OAuth Token (starts with `xoxb-`) to `SLACK_BOT_TOKEN`
5. Get your channel ID from channel details

## Usage

### Local Execution

Run the script normally (posts to Slack):
```bash
npm start
```

Run in dry-run mode (console output only):
```bash
npx tsx asana-task-notifier.ts --dry-run
```

### GitHub Actions

The script can be automated using GitHub Actions. Add your environment variables as repository secrets:

1. Go to Repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `ASANA_ACCESS_TOKEN`
   - `SLACK_BOT_TOKEN`
   - `ASANA_PROJECT_ID`
   - `SLACK_CHANNEL_ID`

Example workflow file (`.github/workflows/asana-slack-notify.yml`):
```yaml
name: Asana to Slack Notification

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at 9 AM JST
  workflow_dispatch:

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm start
        env:
          ASANA_ACCESS_TOKEN: ${{ secrets.ASANA_ACCESS_TOKEN }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          ASANA_PROJECT_ID: ${{ secrets.ASANA_PROJECT_ID }}
          SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
```

## Features

- **Task Filtering**: Automatically filters out subtasks, showing only parent tasks
- **Section Support**: Retrieves tasks from "To-Do" and "In Progress" sections (supports both English and Japanese section names)
- **Due Date Sorting**: Tasks are sorted by due date in ascending order
- **Due Date Display**: Shows due dates in format `~ MM/DD(Day)` next to each task
- **Formatted Output**: Clean Slack formatting with emoji indicators:
  - 🗽 (`:statue_of_liberty:`) for TODO items
  - 🍰 (`:dessert:`) for In Progress items
- **Dry Run Mode**: Test the script without posting to Slack using `--dry-run` flag
- **Environment Variables**: Secure credential management using `.env` file
- **TypeScript**: Fully typed for better development experience
- **Error Handling**: Comprehensive error handling with detailed error messages

### Example Output

```
**🗽 TODOs**
- Review PR #123 ~ 06/26(Thu)
- Update documentation ~ 06/27(Fri)

**🍰 In Progress**
- Implement user authentication
- Fix navigation bug ~ 06/25(Wed)
```

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined"**: Check that all environment variables are set correctly
2. **Authentication errors**: Verify your access tokens are valid and have proper permissions
3. **No tasks appearing**: Ensure your section names match "To-Do"/"todo" or "進行中"/"in progress"
4. **Slack posting fails**: Confirm the bot is invited to the target channel

## License

MIT