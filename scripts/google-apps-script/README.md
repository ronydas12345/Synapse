# Synapse Agile Google Sheet webhook

This binds a small HTTP API to [Synapse_Agile_Sprint_Framework](https://docs.google.com/spreadsheets/d/1o392BAQ4JTxqrrf41j2kUZHH5D9bxhJ8bW2-OJ4wpYM/edit) so Cursor (or you) can **read a summary** and **upsert** backlog, sprint tasks, bugs, and sprint fields.

Google does not let this repo write to your sheet by itself. The script runs **as you**, inside the spreadsheet.

## 1. Install the script

1. Open the spreadsheet → **Extensions → Apps Script**.
2. Delete any placeholder `Code.gs` content.
3. Paste `SynapseAgileWebhook.gs` and save (name the project e.g. `Synapse Agile Webhook`).
4. In the function dropdown, choose **`setupToken`** → **Run**.
5. Authorize the script when Google asks (it needs permission to edit this spreadsheet).
6. Enter a long random token (≥ 16 characters). It is stored in **Script Properties** as `WEBHOOK_TOKEN`, not in the sheet.

To rotate the token later, run `setupToken` again.

## 2. Deploy the web app

1. **Deploy → New deployment**.
2. Type: **Web app**.
3. **Execute as:** Me (your Google account).
4. **Who has access:** **Anyone**.

   Anyone can *hit* the URL, but writes fail without `WEBHOOK_TOKEN`. Do **not** commit the URL or token.

5. **Deploy**, then copy the **Web app URL**  
   (`https://script.google.com/macros/s/…/exec`).

After you change the `.gs` file: **Deploy → Manage deployments → Edit → New version**.

## 3. Local secrets (never commit)

Create `C:\Users\dasro\Synapse\.env` (already gitignored):

```
SYNAPSE_AGILE_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
SYNAPSE_AGILE_WEBHOOK_TOKEN=the-same-token-you-saved-in-setupToken
```

## 4. API

All writes are `POST` with `Content-Type: application/json`.

### `ping`

```json
{ "token": "…", "action": "ping" }
```

### `summary`

Returns dashboard-style counts plus rows that have real IDs (template blank rows are skipped).

```json
{ "token": "…", "action": "summary" }
```

### `setSprint`

Updates **Dashboard → THIS SPRINT** (column B next to the label) and matching **Sprint Planner** fields.

```json
{
  "token": "…",
  "action": "setSprint",
  "row": {
    "sprintName": "Sprint 01",
    "sprintStart": "2026-09-05",
    "sprintEnd": "2026-09-18",
    "sprintGoal": "Listen path + themes are usable end to end.",
    "building": "Play Mode layout, Start jump, theme save/preview.",
    "blocker": "",
    "demo": "2026-09-18",
    "topBug": "",
    "learning": "Container queries vs stacked Listen layout.",
    "capacity": 20,
    "committedPoints": 8,
    "health": "Green",
    "demoDate": "2026-09-18",
    "retroDate": "2026-09-18"
  }
}
```

### `upsertBacklog`

Matches **Product Backlog** column `ID`. Keys must match the header row (`ID`, `Type`, `Epic/Area`, `User Story / Item`, …). You can also send `id` as an alias for `ID`.

```json
{
  "token": "…",
  "action": "upsertBacklog",
  "row": {
    "ID": "SYN-010",
    "Type": "Feature",
    "Epic/Area": "Listen",
    "User Story / Item": "As a listener, I want a Start row on the path bar so I can restart the path.",
    "Why / Value": "Jump back without opening Studio.",
    "Priority": "Must",
    "Status": "Done",
    "Story Points": 2,
    "Acceptance Criteria": "Start row at top of path; click rebuilds queue from Start.",
    "Owner": "Roni",
    "Target Sprint": "Sprint 01",
    "Notes": "Verified in Listen UI"
  }
}
```

### `upsertTask`

**Sprint Board**, key `Task ID` (or `id`). Status values should match the board (e.g. `To Do`, `Doing`, `Review/Test`, `Done`). Set `Blocked?` to `Yes` when blocked.

### `upsertBug`

**Bug Tracker**, key `Bug ID` (or `id`). Use `Status`: `Open`, `In Progress`, `Verified`, etc.

## 5. PowerShell example

From the repo root (loads `.env` if present):

```powershell
.\scripts\google-apps-script\post-agile.ps1 -Action ping
.\scripts\google-apps-script\post-agile.ps1 -Action summary
.\scripts\google-apps-script\post-agile.ps1 -Action upsertBacklog -RowFile .\scripts\google-apps-script\examples\backlog-listen-start.json
```

## 6. How Cursor will use this

Once `.env` exists, ask in chat: *“sync this work to the agile sheet.”* The agent should `POST` `upsertBacklog` / `upsertTask` / `upsertBug` / `setSprint` and only mark **Done** when Definition of Done is actually met (demo/test, not “code was written”).

The Dashboard counters stay formula-driven in the sheet; they will update when real IDs and statuses change. Blank template rows with `Status = Open` still inflate **OPEN BUGS** until you clear those placeholder statuses.

## 7. Security notes

- **Anyone** can call the URL; the token is the real lock.
- Do not put the token in the spreadsheet, GitHub, or chat logs if you can avoid it.
- If the URL leaks, run `setupToken` and **New version** the deployment (or disable the old deployment).
