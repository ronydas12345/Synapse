/**
 * Synapse Agile webhook — paste into the spreadsheet's Apps Script project.
 *
 * Setup:
 *  1. Extensions → Apps Script → paste this file.
 *  2. Run setupToken() once, authorize, store WEBHOOK_TOKEN.
 *  3. Deploy → New deployment → Web app
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Copy the Web app URL. Keep URL + token out of git.
 *
 * POST JSON:
 *  { "token": "...", "action": "ping|summary|setSprint|upsertBacklog|upsertTask|upsertBug", "row": { ... } }
 */

var SHEET = {
  DASHBOARD: 'Dashboard',
  BACKLOG: 'Product Backlog',
  BOARD: 'Sprint Board',
  PLANNER: 'Sprint Planner',
  BUGS: 'Bug Tracker',
};

var ID_HEADERS = {
  'Product Backlog': 'ID',
  'Sprint Board': 'Task ID',
  'Bug Tracker': 'Bug ID',
};

var SPRINT_LABELS = {
  sprintGoal: 'Sprint Goal',
  building: 'What are we building?',
  blocker: 'Biggest blocker',
  demo: 'Next demo',
  topBug: 'Top priority bug',
  learning: 'One thing Roni is learning',
};

function setupToken() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    'Synapse Agile webhook',
    'Enter a long random token (store it only in Script Properties / local env, never in git).',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;
  var token = result.getResponseText().trim();
  if (token.length < 16) {
    ui.alert('Token must be at least 16 characters.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('WEBHOOK_TOKEN', token);
  ui.alert('WEBHOOK_TOKEN saved. Deploy the web app next.');
}

function doGet() {
  return json_({ ok: true, service: 'synapse-agile-webhook', write: false });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var body = parseBody_(e);
    if (!body) return json_({ ok: false, error: 'Invalid JSON' }, 400);
    if (!checkToken_(body.token)) return json_({ ok: false, error: 'Unauthorized' }, 401);

    var action = String(body.action || '').trim();
    switch (action) {
      case 'ping':
        return json_({ ok: true, spreadsheet: SpreadsheetApp.getActiveSpreadsheet().getName() });
      case 'summary':
        return json_({ ok: true, summary: summary_() });
      case 'setSprint':
        return json_(setSprint_(body.row || body.fields || {}));
      case 'upsertBacklog':
        return json_(upsert_(SHEET.BACKLOG, body.row || {}));
      case 'upsertTask':
        return json_(upsert_(SHEET.BOARD, body.row || {}));
      case 'upsertBug':
        return json_(upsert_(SHEET.BUGS, body.row || {}));
      default:
        return json_({ ok: false, error: 'Unknown action: ' + action }, 400);
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) }, 500);
  } finally {
    lock.releaseLock();
  }
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return null;
  }
}

function checkToken_(provided) {
  var expected = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN');
  if (!expected || !provided) return false;
  return String(provided) === expected;
}

function json_(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
  // Apps Script web apps cannot set HTTP status reliably on all deployments.
  if (status && obj && obj.ok === false) obj.status = status;
  return out;
}

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Missing sheet: ' + name);
  return sh;
}

function headerInfo_(sh) {
  var lastCol = Math.max(sh.getLastColumn(), 1);
  var scan = sh.getRange(1, 1, Math.min(12, sh.getMaxRows()), lastCol).getDisplayValues();
  var idWanted = ID_HEADERS[sh.getName()];
  for (var r = 0; r < scan.length; r++) {
    var row = scan[r].map(function (c) {
      return String(c).trim();
    });
    if (idWanted && row.indexOf(idWanted) >= 0) {
      return mapHeaders_(row, r + 1);
    }
    if (row[0] === 'Field' && row[1] === 'Value') {
      return mapHeaders_(row, r + 1);
    }
  }
  throw new Error('Could not find header row on ' + sh.getName());
}

function mapHeaders_(row, headerRow) {
  var map = {};
  for (var c = 0; c < row.length; c++) {
    if (row[c]) map[row[c]] = c + 1;
  }
  return { map: map, headerRow: headerRow };
}

function readObjects_(sh) {
  var info = headerInfo_(sh);
  var start = info.headerRow + 1;
  var lastRow = sh.getLastRow();
  if (lastRow < start) return [];
  var width = sh.getLastColumn();
  var values = sh.getRange(start, 1, lastRow - start + 1, width).getDisplayValues();
  var headers = Object.keys(info.map);
  var items = [];
  for (var i = 0; i < values.length; i++) {
    var obj = { _row: start + i };
    var empty = true;
    headers.forEach(function (h) {
      var col = info.map[h];
      var val = values[i][col - 1];
      obj[h] = val;
      if (String(val).trim()) empty = false;
    });
    if (!empty) items.push(obj);
  }
  return items;
}

function upsert_(sheetName, row) {
  if (!row || typeof row !== 'object') return { ok: false, error: 'row object required' };
  var sh = sheet_(sheetName);
  var info = headerInfo_(sh);
  var idHeader = ID_HEADERS[sheetName];
  var idCol = info.map[idHeader];
  if (!idCol) return { ok: false, error: 'ID column missing: ' + idHeader };

  var id = String(row[idHeader] || row.id || '').trim();
  if (!id) return { ok: false, error: 'Provide ' + idHeader + ' (or id)' };

  var targetRow = findIdRow_(sh, idCol, info.headerRow + 1, id);
  if (!targetRow) targetRow = firstEmptyIdRow_(sh, idCol, info.headerRow + 1);
  if (!targetRow) {
    sh.appendRow(new Array(sh.getLastColumn()).fill(''));
    targetRow = sh.getLastRow();
  }

  Object.keys(info.map).forEach(function (header) {
    var incoming = row[header];
    if (incoming === undefined && header === idHeader) incoming = id;
    if (incoming === undefined) return;
    sh.getRange(targetRow, info.map[header]).setValue(incoming);
  });

  return { ok: true, action: 'upsert', sheet: sheetName, id: id, row: targetRow };
}

function findIdRow_(sh, idCol, startRow, id) {
  var last = sh.getLastRow();
  if (last < startRow) return 0;
  var vals = sh.getRange(startRow, idCol, last - startRow + 1, 1).getDisplayValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === id) return startRow + i;
  }
  return 0;
}

function firstEmptyIdRow_(sh, idCol, startRow) {
  var last = Math.max(sh.getLastRow(), startRow);
  var vals = sh.getRange(startRow, idCol, last - startRow + 1, 1).getDisplayValues();
  for (var i = 0; i < vals.length; i++) {
    if (!String(vals[i][0]).trim()) return startRow + i;
  }
  return 0;
}

function setSprint_(fields) {
  var written = [];
  var dash = sheet_(SHEET.DASHBOARD);
  Object.keys(SPRINT_LABELS).forEach(function (key) {
    if (fields[key] === undefined && fields[SPRINT_LABELS[key]] === undefined) return;
    var value = fields[key] !== undefined ? fields[key] : fields[SPRINT_LABELS[key]];
    writeLabelValue_(dash, SPRINT_LABELS[key], value);
    written.push(SPRINT_LABELS[key]);
  });

  var planner = sheet_(SHEET.PLANNER);
  var plannerMap = {
    sprintName: 'Sprint Name',
    sprintStart: 'Sprint Start',
    sprintEnd: 'Sprint End',
    sprintGoal: 'Sprint Goal',
    capacity: 'Capacity (hours)',
    committedPoints: 'Committed Story Points',
    completedPoints: 'Completed Story Points',
    carryOver: 'Carry-over Story Points',
    health: 'Sprint Health',
    demoDate: 'Demo Date',
    retroDate: 'Retro Date',
  };
  Object.keys(plannerMap).forEach(function (key) {
    if (fields[key] === undefined) return;
    writePlannerField_(planner, plannerMap[key], fields[key]);
    written.push(plannerMap[key]);
  });

  return { ok: true, action: 'setSprint', written: written };
}

function writeLabelValue_(sh, label, value) {
  var last = Math.max(sh.getLastRow(), 1);
  var colA = sh.getRange(1, 1, last, 1).getDisplayValues();
  for (var i = 0; i < colA.length; i++) {
    if (String(colA[i][0]).trim() === label) {
      sh.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  throw new Error('Dashboard label not found: ' + label);
}

function writePlannerField_(sh, field, value) {
  var last = Math.max(sh.getLastRow(), 1);
  var data = sh.getRange(1, 1, last, 2).getDisplayValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === field) {
      sh.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  throw new Error('Sprint Planner field not found: ' + field);
}

function summary_() {
  return {
    dashboard: {
      backlogItems: countNonEmptyIds_(SHEET.BACKLOG),
      openBugs: countByStatus_(SHEET.BUGS, 'Status', 'Open'),
      blockedTasks: countBlocked_(SHEET.BOARD),
      doneTasks: countByStatus_(SHEET.BOARD, 'Status', 'Done'),
    },
    sprint: readPlanner_(),
    backlog: readObjects_(sheet_(SHEET.BACKLOG)).filter(function (r) {
      return String(r.ID || '').trim();
    }),
    tasks: readObjects_(sheet_(SHEET.BOARD)).filter(function (r) {
      return String(r['Task ID'] || '').trim();
    }),
    bugs: readObjects_(sheet_(SHEET.BUGS)).filter(function (r) {
      return String(r['Bug ID'] || '').trim();
    }),
  };
}

function countNonEmptyIds_(sheetName) {
  var sh = sheet_(sheetName);
  var info = headerInfo_(sh);
  var idCol = info.map[ID_HEADERS[sheetName]];
  var start = info.headerRow + 1;
  var last = sh.getLastRow();
  if (last < start) return 0;
  var vals = sh.getRange(start, idCol, last - start + 1, 1).getDisplayValues();
  var n = 0;
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim()) n++;
  }
  return n;
}

function countByStatus_(sheetName, statusHeader, statusValue) {
  var items = readObjects_(sheet_(sheetName));
  var idHeader = ID_HEADERS[sheetName];
  var n = 0;
  items.forEach(function (r) {
    if (!String(r[idHeader] || '').trim()) return;
    if (String(r[statusHeader] || '').trim() === statusValue) n++;
  });
  return n;
}

function countBlocked_(sheetName) {
  var items = readObjects_(sheet_(sheetName));
  var n = 0;
  items.forEach(function (r) {
    if (!String(r['Task ID'] || '').trim()) return;
    var blocked = String(r['Blocked?'] || '').toLowerCase();
    if (blocked === 'yes' || blocked === 'y' || blocked === 'true') n++;
  });
  return n;
}

function readPlanner_() {
  var sh = sheet_(SHEET.PLANNER);
  var last = Math.max(sh.getLastRow(), 1);
  var data = sh.getRange(1, 1, last, 2).getDisplayValues();
  var out = {};
  data.forEach(function (row) {
    var k = String(row[0]).trim();
    if (k && k !== 'Field') out[k] = row[1];
  });
  return out;
}
