/**
 * Google Form -> ANVATION Admin Portal
 * ===================================
 * Paste this file into the Apps Script editor of the spreadsheet that stores your
 * Google Form's responses, then add an "On form submit" trigger. Every new form
 * submission is POSTed to the server's /api/google-form/webhook where it becomes
 * a Team entry in the admin portal's Participant Directory automatically.
 *
 * Setup (one time):
 *   1. Google Form -> Responses tab -> "Link to Sheets" (creates/uses the sheet).
 *   2. In that spreadsheet: Extensions -> Apps Script. Replace all content with this file.
 *   3. Set GOOGLE_FORM_WEBHOOK_URL and GOOGLE_FORM_WEBHOOK_SECRET below.
 *   4. Edit FIELD_MAP so each question title matches your form's EXACT column
 *      header. Ask the developer for the column names if you don't have them.
 *   5. Save, authorize when prompted.
 *   6. Triggers -> Add Trigger -> onFormSubmit, "From spreadsheet",
 *      "On form submit" -> Save.
 *   7. Submit a test response on the form; it should appear in the admin portal.
 */

var GOOGLE_FORM_WEBHOOK_URL =
  'https://YOUR-SITE.vercel.app/api/google-form/webhook'; // <- your deployed URL
var GOOGLE_FORM_WEBHOOK_SECRET = 'YOUR-WEBHOOK-SECRET';    // <- server env var GOOGLE_FORM_WEBHOOK_SECRET

/**
 * Map your form's question titles to canonical fields.
 * Canonical keys (what the server understands):
 *   teamName, domain, paymentUtr,
 *   leader.fullName, leader.email, leader.phone, leader.usn,
 *   leader.college, leader.state, leader.gender,
 *   members.<n>.fullName, members.<n>.email, members.<n>.usn,
 *   members.<n>.college, members.<n>.gender
 */
var FIELD_MAP = {
  // Leader
  'Team / Group Name':       'teamName',        // required
  'Domain / Track':          'domain',
  'Leader - Full Name':      'leader.fullName', // required
  'Leader - Email':          'leader.email',    // required
  'Leader - Phone':          'leader.phone',
  'Leader - USN':            'leader.usn',
  'Leader - College':        'leader.college',
  'Leader - State':          'leader.state',
  'Leader - Gender':         'leader.gender',
  'Payment UTR Number':      'paymentUtr',
  // Members (repeat/remove to match your form's member sections)
  'Member 1 - Full Name':    'members.1.fullName',
  'Member 1 - Email':        'members.1.email',
  'Member 1 - USN':          'members.1.usn',
  'Member 1 - College':      'members.1.college',
  'Member 1 - Gender':       'members.1.gender',
  'Member 2 - Full Name':    'members.2.fullName',
  'Member 2 - Email':        'members.2.email',
  'Member 2 - USN':          'members.2.usn',
  'Member 2 - College':      'members.2.college',
  'Member 2 - Gender':       'members.2.gender'
};

/**
 * Installable trigger. Runs after every form submission.
 * @param {GoogleAppsScript.Events.FormsOnFormSubmit} e
 */
function onFormSubmit(e) {
  try {
    var payload = buildPayload((e && e.namedValues) || {}, e);
    var response = UrlFetchApp.fetch(GOOGLE_FORM_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-webhook-secret': GOOGLE_FORM_WEBHOOK_SECRET },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log('Webhook status: ' + response.getResponseCode() + ' ' + response.getContentText());
  } catch (err) {
    Logger.log('Webhook error: ' + err);
  }
}

/** Turn the form's namedValues into the normalized payload. */
function buildPayload(named, e) {
  function val(key) {
    var mapped = FIELD_MAP[key];
    if (!mapped) return undefined;
    var arr = named[key];
    if (!arr || !arr.length) return undefined;
    return String(arr[0]).trim();
  }
  function person(prefix) {
    return {
      fullName: val(prefix + '.fullName') || '',
      email: val(prefix + '.email') || '',
      phone: val(prefix + '.phone') || '',
      usn: val(prefix + '.usn') || '',
      college: val(prefix + '.college') || '',
      state: val(prefix + '.state') || '',
      gender: val(prefix + '.gender') || ''
    };
  }
  var payload = {
    submissionId: String((e && e.response && e.response.getId ? e.response.getId() : '') || ('sub-' + Date.now())),
    source: 'google_form',
    teamName: val('teamName') || '',
    domain: val('domain') || '',
    paymentUtr: val('paymentUtr') || '',
    leader: person('leader'),
    members: []
  };
  var i = 1;
  while (FIELD_MAP['Member ' + i + ' - Full Name'] !== undefined) {
    if (val('Member ' + i + ' - Full Name')) payload.members.push(person('members.' + i));
    i++;
  }
  return payload;
}