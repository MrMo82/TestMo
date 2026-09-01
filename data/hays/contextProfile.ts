// Hays Talent Delivery Kontextprofil - statische Seed-Daten (Client-Bundle-Kopie der Supabase-Seeds).
// WICHTIG: Keine Secrets, keine produktiven Bewerberdaten, keine echten URLs/API-Keys hier ablegen.
// Quelle der Wahrheit ist die Supabase-Migration `20260901120000_add_context_profiles.sql`.
// Diese Datei versorgt Client-Only-Flows (z.B. lokale ProjectSettings), solange kein Supabase-Context geladen ist.

import {
  ConfirmationStatus,
  ContextProfile,
  ControlledValueSet,
  DataDictionaryEntry,
  RoutingRule,
  TerminologyRule,
} from '../../types';

export const GENERAL_CONTEXT_PROFILE_ID = 'general';
export const HAYS_CONTEXT_PROFILE_ID = 'hays-talent-delivery';
export const HAYS_DICTIONARY_VERSION_V1 = 'v1-2026-09';

// --- H1 System ---
export const HAYS_SYSTEMS = [
  { key: 'hays-website', label: 'Hays Webseite' },
  { key: 'mein-hays', label: 'MeinHays' },
  { key: 'freelancermap', label: 'Freelancermap' },
  { key: 'hays-web-api', label: 'Hays Web/API' },
  { key: 'global-quick-apply-service', label: 'global-quick-apply-service' },
  { key: 'daxtra-capture', label: 'Daxtra Capture' },
  { key: 'iris', label: 'IRIS' },
  { key: 'azure-devops', label: 'Azure DevOps' },
  { key: 'monitoring-logs', label: 'Monitoring / Logs' },
];

// --- F. Prozesse / Bewerbungswege ---
export const HAYS_PROCESSES: ContextProfile['processes'] = [
  {
    key: 'standardbewerbung',
    label: 'Standardbewerbung',
    targetMailbox: 'Parsing_Inbound@hays.de',
    targetSpoolLabel: 'Standard-Spool',
    confirmationStatus: ConfirmationStatus.Confirmed,
  },
  {
    key: 'pso-bewerbung',
    label: 'PSO-Bewerbung',
    targetMailbox: 'PM.PSO-Parsing@hays.de',
    targetSpoolLabel: 'PSO-Spool',
    confirmationStatus: ConfirmationStatus.Confirmed,
  },
  {
    key: 'profilpflege',
    label: 'Profilpflege / Profile Update',
    targetMailbox: 'PM.Profilpflege-Parsing@hays.de',
    targetSpoolLabel: 'Profilpflege-Spool',
    mandatoryRule: 'update-only: darf niemals einen neuen Business Partner in IRIS erzeugen',
    confirmationStatus: ConfirmationStatus.Confirmed,
  },
  {
    key: 'freelancermap-api-bewerbung',
    label: 'Freelancermap API Bewerbung',
    confirmationStatus: ConfirmationStatus.Confirmed,
    systemChain: ['Freelancermap', 'Hays Web/API', 'Daxtra Capture', 'IRIS'],
  },
  {
    key: 'email-bewerbung',
    label: 'E-Mail-Bewerbung',
    confirmationStatus: ConfirmationStatus.Confirmed,
  },
  {
    key: 'cv-rescan',
    label: 'CV-Rescan',
    confirmationStatus: ConfirmationStatus.ReviewRequired,
  },
];

// --- G. Data Dictionary ---
const dict = (partial: Omit<DataDictionaryEntry, 'contextProfileId' | 'dataDictionaryVersion' | 'active'>): DataDictionaryEntry => ({
  ...partial,
  contextProfileId: HAYS_CONTEXT_PROFILE_ID,
  dataDictionaryVersion: HAYS_DICTIONARY_VERSION_V1,
  active: true,
});

export const HAYS_DATA_DICTIONARY: DataDictionaryEntry[] = [
  // G1. Website- und EML-Felder
  dict({ id: 'dxfnm', domain: 'Website/EML', displayName: 'Kandidat Vorname', technicalName: 'DXFNM', prefix: 'DXFNM', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Vorname', description: 'Vorname des Kandidaten aus Webseite/EML.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'dxlnm', domain: 'Website/EML', displayName: 'Kandidat Nachname', technicalName: 'DXLNM', prefix: 'DXLNM', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Name / Nachname', description: 'Nachname des Kandidaten aus Webseite/EML.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'dxeml', domain: 'Website/EML', displayName: 'E-Mail-Adresse', technicalName: 'DXEML', prefix: 'DXEML', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS E-Mail Privat', description: 'E-Mail-Adresse; Zielfeld projektspezifisch zu bestaetigen.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'dxgnd', domain: 'Website/EML', displayName: 'Geschlecht', technicalName: 'DXGND', prefix: 'DXGND', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Geschlecht', description: 'Dokumentiertes Mapping: 1=M, 2=F, 3=D.', allowedValues: ['1=M', '2=F', '3=D'], confirmationStatus: ConfirmationStatus.ReviewRequired, usageNotes: 'Review Required, bis das finale IRIS-Mapping bestaetigt ist.' }),
  dict({ id: 'dxphn', domain: 'Website/EML', displayName: 'Telefon / Mobiltelefon', technicalName: 'DXPHN', prefix: 'DXPHN', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Mobiltelefon', description: 'Daxtra kann auch eine Festnetznummer in das IRIS-Feld Mobiltelefon uebertragen.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'dxsrc', domain: 'Website/EML', displayName: 'Source', technicalName: 'DXSRC', prefix: 'DXSRC', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Erstkontaktart / Marketingaktivitaet', description: 'Finaler Zielwert muss projektbezogen bestaetigt sein.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'dxrfr', domain: 'Website/EML', displayName: 'Referrer / Tracking-Kontext', technicalName: 'DXRFR', prefix: 'DXRFR', sourceSystem: 'Daxtra Capture', description: 'Moegliche Verwendung: UTM-, c-Parameter- oder trackingDomainGroupId-Kontext.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'dxbpi', domain: 'Website/EML', displayName: 'IRIS-ID / BPID', technicalName: 'DXBPI', prefix: 'DXBPI', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', description: 'Lookup und Update eines bestehenden Business Partners in IRIS.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'dxpsf', domain: 'Website/EML', displayName: 'PSO Flag', technicalName: 'DXPSF', prefix: 'DXPSF', sourceSystem: 'Daxtra Capture', description: '0 = Standard, 1 = PSO.', allowedValues: ['0=Standard', '1=PSO'], confirmationStatus: ConfirmationStatus.ReviewRequired, usageNotes: 'Review Required, bis technisch final bestaetigt.' }),
  dict({ id: 'dxpsi', domain: 'Website/EML', displayName: 'PSO ID', technicalName: 'DXPSI', prefix: 'DXPSI', sourceSystem: 'Daxtra Capture', description: 'Nicht mit PSO Flag verwechseln. Keine Beispiel-ID erfinden.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'dxaoe', domain: 'Website/EML', displayName: 'Fachgebiet / Area of Expertise', technicalName: 'DXAOE', prefix: 'DXAOE', sourceSystem: 'Daxtra Capture', description: 'Grundlage der BP-Bereichszuordnung. Beispiele nur verwenden, wenn im Projektkontext bestaetigt.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'dxemp', domain: 'Website/EML', displayName: 'Beschaeftigungsform / Employment Type', technicalName: 'DXEMP', prefix: 'DXEMP', sourceSystem: 'Daxtra Capture', description: 'Dokumentierte Werte: Contracting, Perm, Temp.', allowedValues: ['Contracting', 'Perm', 'Temp'], confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'dxavl', domain: 'Website/EML', displayName: 'Verfuegbarkeitsdatum', technicalName: 'DXAVL', prefix: 'DXAVL', sourceSystem: 'Daxtra Capture', description: 'Dokumentiertes Format: YYYY-MM-DD HH:MM:SS.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'dxpid', domain: 'Website/EML', displayName: 'Prospect-ID(s)', technicalName: 'DXPID', prefix: 'DXPID', sourceSystem: 'Daxtra Capture', description: 'Bis zu zehn Werte im Importtool-Zielbild. Prospect-Nummer und interne Prospect-ID nicht gleichsetzen.', confirmationStatus: ConfirmationStatus.ReviewRequired }),

  // G2. Daxtra-Capture-Standardfelder (nur die im initialen Profil relevanten mit IRIS-Ziel)
  dict({ id: 'daxtra-first-name', domain: 'Daxtra Standard', displayName: 'First Name', technicalName: 'First Name', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Vorname', description: 'Standardfeld First Name.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-last-name', domain: 'Daxtra Standard', displayName: 'Last Name', technicalName: 'Last Name', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Name / Nachname', description: 'Standardfeld Last Name.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-line1', domain: 'Daxtra Standard', displayName: 'Line 1', technicalName: 'Line 1', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Strasse & Hausnummer', description: 'Adresszeile 1.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-city', domain: 'Daxtra Standard', displayName: 'City', technicalName: 'City', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Ort', description: 'Ort.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-postcode', domain: 'Daxtra Standard', displayName: 'Postcode', technicalName: 'Postcode', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS PLZ', description: 'Postleitzahl.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-country', domain: 'Daxtra Standard', displayName: 'Country', technicalName: 'Country', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Land', description: 'Land.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-email1', domain: 'Daxtra Standard', displayName: 'Email 1', technicalName: 'Email 1', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS E-Mail Privat', description: 'Primaere E-Mail.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-email2', domain: 'Daxtra Standard', displayName: 'Email 2', technicalName: 'Email 2', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS E-Mail Projekt', description: 'Sekundaere E-Mail.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-mobile', domain: 'Daxtra Standard', displayName: 'Mobile', technicalName: 'Mobile', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Mobiltelefon', description: 'Mobiltelefonnummer.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-gender', domain: 'Daxtra Standard', displayName: 'Gender', technicalName: 'Gender', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Geschlecht', description: 'Geschlecht laut Daxtra-Extraktion.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'daxtra-nationality1', domain: 'Daxtra Standard', displayName: 'Nationality 1', technicalName: 'Nationality 1', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Nationalitaet', description: 'Primaere Nationalitaet.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-dob', domain: 'Daxtra Standard', displayName: 'Date of Birth', technicalName: 'Date of Birth', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Geburtsdatum', description: 'Geburtsdatum.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'daxtra-skill-role', domain: 'Daxtra Standard', displayName: 'Skill / Role', technicalName: 'Skill / Role', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Skills und Rollen', description: 'Nur soweit im jeweiligen Prozess verwendet; nicht pauschal alle Work-History-Felder annehmen.', confirmationStatus: ConfirmationStatus.ReviewRequired }),

  // G3. Hays-spezifische Daxtra User Fields
  dict({ id: 'x-availability-date', domain: 'Daxtra User Field', displayName: 'Verfuegbarkeitsdatum', technicalName: 'xavailability_date', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Verfuegbarkeit', description: 'Verfuegbarkeitsdatum des Kandidaten.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'x-email-from', domain: 'Daxtra User Field', displayName: 'E-Mail-Absender des Daxtra-Auftrags', technicalName: 'XEMAIL_FROM', sourceSystem: 'Daxtra Capture', description: 'Absenderadresse des verarbeitenden Auftrags.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'x-from-address', domain: 'Daxtra User Field', displayName: 'Absenderadresse des Daxtra-Auftrags', technicalName: 'XFROM_ADDRESS', sourceSystem: 'Daxtra Capture', description: 'Absenderadresse.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'x-from-name', domain: 'Daxtra User Field', displayName: 'Name des Erstellers', technicalName: 'XFROM_NAME', sourceSystem: 'Daxtra Capture', description: 'Name des Erstellers des Auftrags.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'x-focus-area', domain: 'Daxtra User Field', displayName: 'Default-Schwerpunkt', technicalName: 'XFOCUS_AREA', sourceSystem: 'Daxtra Capture', targetSystem: 'IRIS', targetField: 'IRIS Schwerpunkt', description: 'Default-Schwerpunkt.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'x-job-board-id', domain: 'Daxtra User Field', displayName: 'Prospect-Nummer', technicalName: 'xjob_board_id', sourceSystem: 'Daxtra Capture', description: 'Review Required, falls im Zielprojekt eine interne Prospect-ID statt Nummer erwartet wird.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'x-job-id', domain: 'Daxtra User Field', displayName: 'Prospect-Nummer', technicalName: 'xjob_id', sourceSystem: 'Daxtra Capture', description: 'Review Required.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'x-linkedin-url', domain: 'Daxtra User Field', displayName: 'LinkedIn-URL des Kandidaten', technicalName: 'XLINKEDIN_URL', sourceSystem: 'Daxtra Capture', description: 'LinkedIn-URL, falls vorhanden.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'x-source', domain: 'Daxtra User Field', displayName: 'Trackinginformation der Bewerbung', technicalName: 'xsource', sourceSystem: 'Daxtra Capture', description: 'Moegliche IRIS-Ziele projektbezogen bestaetigen.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'x-spool-data', domain: 'Daxtra User Field', displayName: 'Daxtra Spool-Spezifika', technicalName: 'XSPOOL_DATA', sourceSystem: 'Daxtra Capture', description: 'Spool-Spezifika.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'x-spool-name', domain: 'Daxtra User Field', displayName: 'Verwendeter Daxtra Spool', technicalName: 'XSPOOL_NAME', sourceSystem: 'Daxtra Capture', description: 'Verwendeter Spool-Name.', confirmationStatus: ConfirmationStatus.Confirmed }),

  // G4. IRIS-Felder und Objekte (als Data-Dictionary-Eintraege, Werte auch in Controlled Value Set IRIS_FIELD)
  dict({ id: 'iris-business-partner', domain: 'IRIS', displayName: 'Business Partner / BP', technicalName: 'IRIS_BP', targetSystem: 'IRIS', description: 'Zentrales Kandidatenobjekt in IRIS.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'iris-bpid', domain: 'IRIS', displayName: 'IRIS-ID / BPID', technicalName: 'IRIS_BPID', targetSystem: 'IRIS', description: 'Eindeutiger Identifier des Business Partners.', confirmationStatus: ConfirmationStatus.Confirmed }),

  // G5. Freelancermap- und Quick-Apply-API-Felder
  dict({ id: 'api-header-id', domain: 'Freelancermap API', displayName: 'Header.Id', technicalName: 'Header.Id', sourceSystem: 'Freelancermap', description: 'UUID-basierte Correlation-/Conversation-ID laut ATSi-V4-Kontext.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-header-jobboardid', domain: 'Freelancermap API', displayName: 'Header.JobBoardId', technicalName: 'Header.JobBoardId', sourceSystem: 'Freelancermap', description: 'Finaler Wert muss im Hays-Projektkontext bestaetigt werden.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'api-header-jobboardname', domain: 'Freelancermap API', displayName: 'Header.JobBoardName', technicalName: 'Header.JobBoardName', sourceSystem: 'Freelancermap', description: 'Name des Jobboards.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-header-originalurl', domain: 'Freelancermap API', displayName: 'Header.OriginalUrl', technicalName: 'Header.OriginalUrl', sourceSystem: 'Freelancermap', description: 'Darf nicht mit erfundenen URLs gefuellt werden.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-header-effectiveurl', domain: 'Freelancermap API', displayName: 'Header.EffectiveUrl', technicalName: 'Header.EffectiveUrl', sourceSystem: 'Freelancermap', description: 'Darf nicht mit erfundenen URLs gefuellt werden.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-header-atsiapplicationid', domain: 'Freelancermap API', displayName: 'Header.AtsiApplicationId', technicalName: 'Header.AtsiApplicationId', sourceSystem: 'Freelancermap', description: 'Nur verwenden, wenn das finale Hays-Mapping dies bestaetigt.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'api-body-email', domain: 'Freelancermap API', displayName: 'Body.Email', technicalName: 'Body.Email', sourceSystem: 'Freelancermap', description: 'E-Mail-Adresse im Bewerbungs-Body.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-body-firstname', domain: 'Freelancermap API', displayName: 'Body.FirstName', technicalName: 'Body.FirstName', sourceSystem: 'Freelancermap', description: 'Vorname im Bewerbungs-Body.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-body-surname', domain: 'Freelancermap API', displayName: 'Body.Surname', technicalName: 'Body.Surname', sourceSystem: 'Freelancermap', description: 'Nachname im Bewerbungs-Body.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-body-mobile', domain: 'Freelancermap API', displayName: 'Body.Mobile', technicalName: 'Body.Mobile', sourceSystem: 'Freelancermap', description: 'Mobiltelefonnummer im Bewerbungs-Body.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-body-cv', domain: 'Freelancermap API', displayName: 'Body.CV', technicalName: 'Body.CV', sourceSystem: 'Freelancermap', description: 'Im generischen V4-Contract erforderlich.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-body-coverletter', domain: 'Freelancermap API', displayName: 'Body.CoverLetter', technicalName: 'Body.CoverLetter', sourceSystem: 'Freelancermap', description: 'Nur gemaess bestaetigtem Dokumentvertrag erwarten.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'api-body-additionaldocuments', domain: 'Freelancermap API', displayName: 'Body.AdditionalDocuments', technicalName: 'Body.AdditionalDocuments', sourceSystem: 'Freelancermap', description: 'Nur gemaess bestaetigtem Dokumentvertrag erwarten.', confirmationStatus: ConfirmationStatus.ReviewRequired }),
  dict({ id: 'api-doc-binarydata', domain: 'Freelancermap API', displayName: 'BinaryData', technicalName: 'BinaryData', sourceSystem: 'Freelancermap', description: 'Base64-Dateiinhalt.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-doc-filetype', domain: 'Freelancermap API', displayName: 'FileType', technicalName: 'FileType', sourceSystem: 'Freelancermap', description: 'Getrennt von FileName zu pruefen. Groessenlimits/Formate als versionierte kontrollierte Werte pflegen.', confirmationStatus: ConfirmationStatus.Confirmed }),
  dict({ id: 'api-doc-filename', domain: 'Freelancermap API', displayName: 'FileName', technicalName: 'FileName', sourceSystem: 'Freelancermap', description: 'Getrennt von FileType zu pruefen.', confirmationStatus: ConfirmationStatus.Confirmed }),
];

// --- H. Kontrollierte Dropdowns ---
const cv = (partial: Omit<ControlledValueSet, 'version'>): ControlledValueSet => ({ ...partial, version: HAYS_DICTIONARY_VERSION_V1 });

export const HAYS_CONTROLLED_VALUE_SETS: ControlledValueSet[] = [
  cv({ key: 'SYSTEM', label: 'System', values: HAYS_SYSTEMS.map(s => s.label), multiSelect: true, required: true, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'ENVIRONMENT', label: 'Environment', values: ['Development', 'INT', 'Test', 'PreProd', 'Production / Live'], multiSelect: false, required: true, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID, GENERAL_CONTEXT_PROFILE_ID] }),
  cv({ key: 'APPLICATION_FLOW', label: 'Bewerbungsweg', values: HAYS_PROCESSES.map(p => p.label), multiSelect: false, required: true, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'SUBMISSION_TYPE', label: 'Submission Type', values: ['application', 'pso_application', 'profile_update'], multiSelect: false, required: false, confirmationStatus: ConfirmationStatus.ReviewRequired, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'DAXTRA_STATUS', label: 'Daxtra Status', values: ['Successfully loaded', 'Successfully updated', 'Missing Information', 'Possible Update', 'Failed to Load'], multiSelect: true, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'IRIS_OUTCOME', label: 'IRIS-Ergebnis', values: ['BP neu angelegt', 'Bestehender BP aktualisiert', 'Bewerbung dem Prospect zugeordnet', 'Kontakt angelegt', 'Journal angelegt', 'Dokument / O-Profil vorhanden', 'Manuelle Pruefung erforderlich', 'Keine Neuanlage', 'Keine Aenderung'], multiSelect: true, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'MATCHING_RESULT', label: 'Matching-Ergebnis', values: ['BPID eindeutig gefunden', 'Eindeutiger Treffer ueber Vorname, Nachname und E-Mail', 'Kein Treffer', 'Mehrfachtreffer', 'GDPR Lock / nicht verarbeitbar', 'GDPR Delete / Regel zu bestaetigen'], multiSelect: false, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'DOCUMENT_ROLE', label: 'Dokumentrolle', values: ['CV / Haupt-CV', 'CoverLetter / Anschreiben', 'AdditionalDocument / Zusatzdokument', 'O-Profil', 'Daxtra Original Email', 'Nicht klassifiziert'], multiSelect: true, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'FILE_TYPE', label: 'Dateityp', values: ['doc', 'docx', 'odt', 'pdf', 'rtf', 'txt', 'jpeg', 'jpg', 'png'], multiSelect: true, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'EMPLOYMENT_TYPE', label: 'Beschaeftigungsform', values: ['Contracting', 'Perm', 'Temp'], multiSelect: false, required: false, confirmationStatus: ConfirmationStatus.ReviewRequired, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'PSO_FLAG', label: 'PSO Flag', values: ['0 = Standard', '1 = PSO'], multiSelect: false, required: false, confirmationStatus: ConfirmationStatus.ReviewRequired, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'COUNTRY_SOURCE', label: 'Country Source', values: ['DE', 'AT', 'CH', 'DK'], multiSelect: false, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'TEST_TYPE', label: 'Testtyp', values: ['Readiness', 'Smoke', 'Functional', 'Integration', 'API', 'E2E', 'Regression', 'Negative', 'Boundary', 'Security', 'Resilience', 'Cutover', 'Rollback'], multiSelect: true, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID, GENERAL_CONTEXT_PROFILE_ID] }),
  cv({ key: 'PRIORITY', label: 'Prioritaet', values: ['Critical', 'High', 'Medium', 'Low'], multiSelect: false, required: true, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID, GENERAL_CONTEXT_PROFILE_ID] }),
  cv({ key: 'CASE_STATUS', label: 'Case Status', values: ['Draft', 'NotStarted', 'InProgress', 'Passed', 'Failed', 'Blocked'], multiSelect: false, required: true, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID, GENERAL_CONTEXT_PROFILE_ID] }),
  cv({ key: 'EVIDENCE', label: 'Evidence', values: ['Screenshot', 'Request Payload', 'Response Payload', 'HAR', 'Browser Console Log', 'Service Log', 'Daxtra Docket-ID', 'IRIS-ID / BPID', 'Prospect-ID', 'PSO-ID', 'Timestamp', 'Correlation-ID'], multiSelect: true, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID, GENERAL_CONTEXT_PROFILE_ID] }),
  cv({ key: 'READINESS', label: 'Readiness', values: ['Confirmed', 'Conditional Ready', 'Draft / Blocked'], multiSelect: false, required: true, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID, GENERAL_CONTEXT_PROFILE_ID] }),
  cv({ key: 'OWNER_DOMAIN', label: 'Owner Domain', values: ['Business / Talent Delivery', 'Hays Web/API', 'IRIS', 'Daxtra', 'Freelancermap / KESI', 'Security', 'Data Protection / Legal', 'Operations / IAS'], multiSelect: false, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
  cv({ key: 'IRIS_FIELD', label: 'IRIS-Pruffeld', values: ['Business Partner / BP', 'IRIS-ID / BPID', 'Vorname', 'Name / Nachname', 'Geschlecht', 'BP-Sprache', 'Strasse & Hausnummer', 'PLZ', 'Ort', 'Land', 'E-Mail Privat', 'E-Mail Projekt', 'Mobiltelefon', 'Nationalitaet', 'Geburtsdatum', 'Verfuegbarkeit', 'Verfuegbarkeit in %', 'Schwerpunkt', 'BP-Bereich', 'Erstkontaktart', 'Marketingaktivitaet', 'Bewerbung', 'Prospect-Zuordnung', 'Kontakte', 'Journal', 'Dokument / O-Profil', 'Skills', 'Rollen', 'GDPR Lock', 'GDPR Delete'], multiSelect: true, required: false, confirmationStatus: ConfirmationStatus.Confirmed, applicableProjects: [HAYS_CONTEXT_PROFILE_ID] }),
];

// --- Terminologieregeln ---
export const HAYS_TERMINOLOGY_RULES: TerminologyRule[] = [
  { id: 'term-ats', forbiddenTerm: 'ATS', replacementGuidance: 'IRIS, wenn IRIS das Zielsystem ist', contextCondition: 'IRIS ist Zielsystem', severity: 'error', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-candidate-record', forbiddenTerm: 'Candidate Record', replacementGuidance: 'Business Partner (BP) oder IRIS Kandidatendatensatz', severity: 'error', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-application-record', forbiddenTerm: 'Application Record', replacementGuidance: 'Bewerbung oder Prospect-Zuordnung', severity: 'error', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-downstream-handover', forbiddenTerm: 'Downstream Handover', replacementGuidance: 'Konkreter Daxtra-Status oder bestaetigte fachliche Beschreibung; kein erfundener Logtext.', severity: 'error', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-app-id', forbiddenTerm: 'APP-', replacementGuidance: 'Nur verwenden, wenn im Data Dictionary bestaetigte ID-Konvention; sonst Request-/Correlation-ID referenzieren.', severity: 'error', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-processed-successfully', forbiddenTerm: 'processed successfully', replacementGuidance: 'Konkreter bestaetigter Daxtra-Status bzw. IRIS-Ergebnis statt generischer Erfolgsmeldung.', severity: 'error', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-system-status', forbiddenTerm: 'system status', replacementGuidance: 'Konkreter Daxtra-Status oder IRIS-Ergebnis.', severity: 'warning', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-manual-queue', forbiddenTerm: 'manual queue', replacementGuidance: 'Konkreter Daxtra-Status (z.B. Missing Information) oder bestaetigter manueller Pruefpfad.', severity: 'warning', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-category', forbiddenTerm: 'Category', replacementGuidance: 'Fachgebiet, Beschaeftigungsform oder BP-Bereich, abhaengig vom Kontext.', severity: 'warning', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-reference-id', forbiddenTerm: 'Reference ID', replacementGuidance: 'Konkreter ID-Typ: IRIS-ID/BPID, Prospect-Nummer, Prospect-ID, PSO-ID, Daxtra Docket-ID oder Request-/Correlation-ID.', severity: 'warning', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'term-success', forbiddenTerm: 'Success', replacementGuidance: 'Konkreter Objekt- und Feldzustand statt generischem "Success".', severity: 'info', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
];

// --- Routingregeln (Importtool-Ablösung) ---
export const HAYS_ROUTING_RULES: RoutingRule[] = [
  { id: 'route-standardbewerbung', processKey: 'standardbewerbung', description: 'Standardbewerbung wird an die Standard-Parsing-Mailbox geroutet.', targetMailbox: 'Parsing_Inbound@hays.de', targetSpoolLabel: 'Standard-Spool', confirmationStatus: ConfirmationStatus.Confirmed, contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'route-pso-bewerbung', processKey: 'pso-bewerbung', description: 'PSO-Bewerbung wird an die PSO-Parsing-Mailbox geroutet. PSO Flag und PSO ID nicht verwechseln.', targetMailbox: 'PM.PSO-Parsing@hays.de', targetSpoolLabel: 'PSO-Spool', confirmationStatus: ConfirmationStatus.Confirmed, contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { id: 'route-profilpflege', processKey: 'profilpflege', description: 'Profilpflege ist update-only und darf ohne matchbaren bestehenden BP keine Neuanlage ausloesen (kontrollierter Stop- bzw. manueller Pruefpfad erforderlich).', targetMailbox: 'PM.Profilpflege-Parsing@hays.de', targetSpoolLabel: 'Profilpflege-Spool', mandatoryRule: 'update-only', confirmationStatus: ConfirmationStatus.Confirmed, contextProfileId: HAYS_CONTEXT_PROFILE_ID },
];

// --- QA-Contract-Sätze (strukturiert, siehe Abschnitt K) ---
export const HAYS_QA_RULES: string[] = [
  'Keine Systeme, Felder, Endpunkte, URLs, Statuswerte, IDs, Enums, Pflichtwerte, Logtexte oder Fehlercodes erfinden.',
  'Confirmed-, Review-Required- und Deprecated-Werte unterscheiden; Review-Required nicht als verbindliches Soll darstellen.',
  'Draft-first bei unvollstaendiger Spezifikation.',
  'E2E ist erst bestanden, wenn technische Annahme, Daxtra-Verarbeitung und fachliches IRIS-Ergebnis geprueft sind. HTTP 200, Correlation-ID, Docket-ID oder "Successfully loaded" allein reicht nicht.',
  'Profilpflege ist update-only und darf keinen neuen Business Partner in IRIS erzeugen.',
  'GDPR Lock darf weder Update noch automatische Ersatz-Neuanlage veranlassen.',
  'Mehrfachtreffer duerfen nicht zufaellig aktualisiert werden.',
  'Keine produktiven Bewerberdaten, Passwoerter oder API-Keys generieren; nur synthetische oder ausdruecklich freigegebene Testdaten verwenden.',
  'Drafts fliessen nicht in Pass Rate und Testausfuehrung ein.',
];

export const HAYS_CONTEXT_PROFILE: ContextProfile = {
  id: HAYS_CONTEXT_PROFILE_ID,
  organization: 'Hays',
  name: 'Hays Talent Delivery',
  version: '1.0.0',
  status: 'active',
  systems: HAYS_SYSTEMS,
  processes: HAYS_PROCESSES,
  fields: HAYS_DATA_DICTIONARY.map(entry => entry.id),
  controlledValues: HAYS_CONTROLLED_VALUE_SETS.map(set => set.key),
  routingRules: HAYS_ROUTING_RULES.map(rule => rule.id),
  wordingRules: HAYS_TERMINOLOGY_RULES.map(rule => rule.id),
  forbiddenTerms: HAYS_TERMINOLOGY_RULES.map(rule => rule.forbiddenTerm),
  evidenceTypes: ['Screenshot', 'Daxtra Docket-ID', 'IRIS-ID / BPID', 'Prospect-ID', 'PSO-ID', 'Correlation-ID', 'Request/Response', 'HAR', 'Console Log', 'Service Log', 'Timestamp'],
  qaRules: HAYS_QA_RULES,
  dataDictionaryVersions: [HAYS_DICTIONARY_VERSION_V1],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

export const GENERAL_CONTEXT_PROFILE: ContextProfile = {
  id: GENERAL_CONTEXT_PROFILE_ID,
  organization: 'Allgemein',
  name: 'Allgemein',
  version: '1.0.0',
  status: 'active',
  systems: [],
  processes: [],
  fields: [],
  controlledValues: ['ENVIRONMENT', 'TEST_TYPE', 'PRIORITY', 'CASE_STATUS', 'EVIDENCE', 'READINESS'],
  routingRules: [],
  wordingRules: [],
  forbiddenTerms: [],
  evidenceTypes: ['Screenshot', 'Timestamp'],
  qaRules: ['Draft-first bei unvollstaendiger Spezifikation.', 'Keine Fakten erfinden.'],
  dataDictionaryVersions: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

export const ALL_CONTEXT_PROFILES: ContextProfile[] = [GENERAL_CONTEXT_PROFILE, HAYS_CONTEXT_PROFILE];

// --- H2 (referenziert, exportiert fuer Wiederverwendung) ---
export const PROJECT_TYPES: { key: string; label: string; contextProfileId: string }[] = [
  { key: 'importtool-ablösung', label: 'Importtool-Ablösung', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { key: 'inboxexit-freelancermap-api', label: 'InboxExit / Freelancermap API', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { key: 'daxtra-capture-incident', label: 'Daxtra Capture Incident', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { key: 'iris-regression', label: 'IRIS Regression', contextProfileId: HAYS_CONTEXT_PROFILE_ID },
  { key: 'allgemeines-testprojekt', label: 'Allgemeines Testprojekt', contextProfileId: GENERAL_CONTEXT_PROFILE_ID },
];
