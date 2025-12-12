# howl-train
HowlTrain: A Discord bot that provides train information.

## Web (Next.js)

### Setup
- Copy `.env.example` to `.env.local`（推奨）
- Set `ODPT_CONSUMER_KEY` (標準API: 東京メトロ/都営/多くの私鉄)
- Set `ODPT_CHALLENGE_CONSUMER_KEY` (Challenge API: JR東日本/東武/京急)

※ `.env` に入れても動く場合がありますが、誤ってコミットしやすいので `.env.local` を推奨します。

### Run
```powershell
npm install
npm run dev
```
