const Asana = require('asana');
import { WebClient as SlackClient } from '@slack/web-api';
import * as dotenv from 'dotenv';

// .envファイルから環境変数を読み込み
dotenv.config();

interface AsanaTask {
  gid: string;
  name: string;
  due_on: string | null;
  memberships: Array<{
    section: {
      gid: string;
      name: string;
    } | null;
  }>;
}

interface TaskSection {
  todo: AsanaTask[];
  inProgress: AsanaTask[];
}

class AsanaSlackNotifier {
  private asanaClient: any;
  private slackClient: SlackClient;
  private projectId: string;
  private slackChannel: string;

  constructor(
    asanaToken: string,
    slackToken: string,
    projectId: string,
    slackChannel: string
  ) {
    // Asana SDK v3の初期化
    const client = Asana.ApiClient.instance;
    const token = client.authentications['token'];
    token.accessToken = asanaToken;
    
    this.asanaClient = client;
    this.slackClient = new SlackClient(slackToken);
    this.projectId = projectId;
    this.slackChannel = slackChannel;
  }

  async run(dryRun: boolean = false): Promise<void> {
    try {
      const tasks = await this.fetchAsanaTasks();
      const message = this.formatSlackMessage(tasks);
      
      if (dryRun) {
        console.log('=== DRY RUN MODE ===');
        console.log('Message that would be sent to Slack:');
        console.log('---');
        console.log(message);
        console.log('---');
        console.log(`Channel: ${this.slackChannel}`);
      } else {
        await this.postToSlack(message);
        console.log('Successfully posted to Slack');
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  private async fetchAsanaTasks(): Promise<TaskSection> {
    const tasksApi = new Asana.TasksApi();
    const opts = {
      opt_fields: 'gid,name,due_on,memberships.section.name,memberships.section.gid,parent'
    };
    const response = await tasksApi.getTasksForProject(this.projectId, opts);

    const taskSection: TaskSection = {
      todo: [],
      inProgress: []
    };

    for (const task of response.data) {
      // サブタスクは除外（親タスクのみを対象とする）
      if (task.parent) {
        continue; // サブタスクはスキップ
      }

      // セクション名で振り分け
      const membership = task.memberships?.[0];
      if (membership?.section) {
        const sectionName = membership.section.name.toLowerCase();
        
        if (sectionName.includes('to-do') || sectionName.includes('todo')) {
          taskSection.todo.push(task);
        } else if (sectionName.includes('進行中') || sectionName.includes('in progress')) {
          taskSection.inProgress.push(task);
        }
      }
    }

    // 期日でソート（ASC）
    const sortByDueDate = (a: AsanaTask, b: AsanaTask) => {
      if (!a.due_on && !b.due_on) return 0;
      if (!a.due_on) return 1;
      if (!b.due_on) return -1;
      return new Date(a.due_on).getTime() - new Date(b.due_on).getTime();
    };

    taskSection.todo.sort(sortByDueDate);
    taskSection.inProgress.sort(sortByDueDate);

    return taskSection;
  }

  private formatSlackMessage(tasks: TaskSection): string {
    let message = '';

    // 日付フォーマット関数
    const formatDueDate = (dueOn: string | null): string => {
      if (!dueOn) return '';
      const date = new Date(dueOn);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekday = weekdays[date.getDay()];
      return ` ~ ${month}/${day}(${weekday})`;
    };

    // TODOセクション
    message += '** :statue_of_liberty: TODOs **\n';
    if (tasks.todo.length === 0) {
      message += '- なし\n';
    } else {
      tasks.todo.forEach(task => {
        message += `- ${task.name}${formatDueDate(task.due_on)}\n`;
      });
    }

    message += '\n';

    // 進行中セクション
    message += '** :taco: 進行中 **\n';
    if (tasks.inProgress.length === 0) {
      message += '- なし\n';
    } else {
      tasks.inProgress.forEach(task => {
        message += `- ${task.name}${formatDueDate(task.due_on)}\n`;
      });
    }

    return message;
  }

  private async postToSlack(message: string): Promise<void> {
    await this.slackClient.chat.postMessage({
      channel: this.slackChannel,
      text: message,
      mrkdwn: true
    });
  }
}

// メイン実行関数
async function main() {
  const asanaToken = process.env.ASANA_ACCESS_TOKEN;
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const projectId = process.env.ASANA_PROJECT_ID;
  const slackChannel = process.env.SLACK_CHANNEL_ID;

  if (!asanaToken || !slackToken || !projectId || !slackChannel) {
    throw new Error('Required environment variables are missing');
  }

  // --dry-run オプションのチェック
  const dryRun = process.argv.includes('--dry-run');

  const notifier = new AsanaSlackNotifier(
    asanaToken,
    slackToken,
    projectId,
    slackChannel
  );

  await notifier.run(dryRun);
}

// エラーハンドリング付きで実行
main().catch(error => {
  console.error('Failed to run notifier:', error);
  process.exit(1);
});