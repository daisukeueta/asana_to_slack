# CLAUDE.md - Asana to Slack Task Notifier

## 概要

AsanaのタスクをSlackに定期通知するTypeScriptスクリプトです。GitHub Actionsで毎日定時実行し、チームのタスク状況を可視化します。

## 機能仕様

### 対象タスク
- AsanaプロジェクトのTo-Doセクションと進行中セクションのタスクを取得
- **親タスクのみを表示**（サブタスクは除外）
- 期日の昇順（ASC）でソート

### Slack投稿フォーマット
```
**:statue_of_liberty: TODOs**
- TASK A
**:dessert: 進行中**
- TASK B
```

### 実行タイミング
- 毎日朝9時（JST）に自動実行
- GitHub Actions の workflow_dispatch で手動実行も可能

## ファイル構成

```
.github/
  workflows/
    asana-slack-notify.yml    # GitHub Actionsワークフロー
asana-slack-notifier.ts       # メインスクリプト
package.json                  # 依存関係定義
tsconfig.json                 # TypeScript設定
CLAUDE.md                     # このドキュメント
```

## セットアップ手順

### 1. Asana設定

#### Personal Access Token取得
1. Asanaにログイン
2. 設定 → アプリ → 個人用アクセストークンを作成
3. トークンをコピー

#### Project ID取得
1. 対象プロジェクトを開く
2. URLから Project ID を確認
   - 例: `https://app.asana.com/0/1234567890/list` の `1234567890`

### 2. Slack設定

#### Slack App作成
1. https://api.slack.com/apps にアクセス
2. 「Create New App」→「From scratch」を選択
3. App名とワークスペースを設定

#### Bot権限設定
1. OAuth & Permissions に移動
2. Bot Token Scopes に追加：
   - `chat:write`
   - `chat:write.public`

#### Appインストール
1. 「Install to Workspace」をクリック
2. Bot User OAuth Token（`xoxb-`で始まる）をコピー

#### Channel ID取得
1. 投稿先チャンネルで右クリック → チャンネル詳細を表示
2. 最下部のチャンネルIDをコピー

### 3. GitHub設定

リポジトリの Settings → Secrets and variables → Actions で以下を追加：

| Secret名 | 説明 |
|---------|------|
| `ASANA_ACCESS_TOKEN` | AsanaのPersonal Access Token |
| `SLACK_BOT_TOKEN` | SlackのBot User OAuth Token |
| `ASANA_PROJECT_ID` | AsanaのProject ID |
| `SLACK_CHANNEL_ID` | SlackのChannel ID |

### 4. ファイル配置

1. リポジトリに必要なファイルを配置
2. `tsconfig.json` を作成：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

## ローカルテスト

```bash
# 環境変数設定
export ASANA_ACCESS_TOKEN="your-token"
export SLACK_BOT_TOKEN="xoxb-your-token"
export ASANA_PROJECT_ID="your-project-id"
export SLACK_CHANNEL_ID="your-channel-id"

# 依存関係インストール
npm install

# 実行
npm start
```

## カスタマイズ

### 実行時間の変更

`.github/workflows/asana-slack-notify.yml` のcron設定を編集：

```yaml
# 例: 平日の朝9時と夕方6時
schedule:
  - cron: '0 0 * * 1-5'    # 平日朝9時（JST）
  - cron: '0 9 * * 1-5'    # 平日夕方6時（JST）
```

### セクション名の変更

Asanaのセクション名が異なる場合、`asana-slack-notifier.ts` の判定ロジックを修正：

```typescript
// 例: 「タスク」「作業中」というセクション名の場合
if (sectionName.includes('タスク') || sectionName.includes('to-do')) {
  taskSection.todo.push(task);
} else if (sectionName.includes('作業中') || sectionName.includes('進行中')) {
  taskSection.inProgress.push(task);
}
```

### メッセージ形式の変更

期日を表示したい場合の例：

```typescript
tasks.todo.forEach(task => {
  const dueDate = task.due_on 
    ? ` (期日: ${new Date(task.due_on).toLocaleDateString('ja-JP')})` 
    : '';
  message += `- ${task.name}${dueDate}\n`;
});
```

## トラブルシューティング

### Asanaタスクが取得できない
- [ ] Personal Access Tokenが正しく設定されているか
- [ ] Project IDが正しいか
- [ ] Asanaプロジェクトにアクセス権限があるか
- [ ] セクション名が「To-Do」「進行中」と一致しているか

### Slackに投稿されない
- [ ] Bot TokenにScopeが正しく設定されているか
- [ ] BotがチャンネルにInviteされているか
- [ ] Channel IDが正しいか（CではなくチャンネルIDを使用）

### GitHub Actionsが失敗する
- [ ] Secretsが正しく設定されているか
- [ ] ワークフローファイルの構文エラーがないか
- [ ] Actions実行ログでエラー詳細を確認
