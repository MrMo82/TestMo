-- Seed-Daten: Hays Data Dictionary, kontrollierte Wertelisten, Terminologie- und Routingregeln.
-- Konsistent mit data/hays/contextProfile.ts (Client-Kopie fuer Offline-/Fallback-Nutzung).
-- Enthaelt ausschliesslich konfigurative Referenzwerte: keine Secrets, keine produktiven Bewerberdaten, keine API-Keys.
-- Wiederholbar dank "on conflict do nothing" (siehe docs/hays-context-profile.md).

-- --- Data Dictionary: G1 Website-/EML-Felder ---
insert into public.data_dictionary_entries (id, context_profile_id, data_dictionary_version, domain, display_name, technical_name, prefix, source_system, target_system, target_field, description, allowed_values, confirmation_status, usage_notes) values
('dxfnm', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Kandidat Vorname', 'DXFNM', 'DXFNM', 'Daxtra Capture', 'IRIS', 'IRIS Vorname', 'Vorname des Kandidaten aus Webseite/EML.', null, 'Confirmed', null),
('dxlnm', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Kandidat Nachname', 'DXLNM', 'DXLNM', 'Daxtra Capture', 'IRIS', 'IRIS Name / Nachname', 'Nachname des Kandidaten aus Webseite/EML.', null, 'Confirmed', null),
('dxeml', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'E-Mail-Adresse', 'DXEML', 'DXEML', 'Daxtra Capture', 'IRIS', 'IRIS E-Mail Privat', 'E-Mail-Adresse; Zielfeld projektspezifisch zu bestaetigen.', null, 'Review Required', null),
('dxgnd', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Geschlecht', 'DXGND', 'DXGND', 'Daxtra Capture', 'IRIS', 'IRIS Geschlecht', 'Dokumentiertes Mapping: 1=M, 2=F, 3=D.', array['1=M','2=F','3=D'], 'Review Required', 'Review Required, bis das finale IRIS-Mapping bestaetigt ist.'),
('dxphn', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Telefon / Mobiltelefon', 'DXPHN', 'DXPHN', 'Daxtra Capture', 'IRIS', 'IRIS Mobiltelefon', 'Daxtra kann auch eine Festnetznummer in das IRIS-Feld Mobiltelefon uebertragen.', null, 'Confirmed', null),
('dxsrc', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Source', 'DXSRC', 'DXSRC', 'Daxtra Capture', 'IRIS', 'IRIS Erstkontaktart / Marketingaktivitaet', 'Finaler Zielwert muss projektbezogen bestaetigt sein.', null, 'Review Required', null),
('dxrfr', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Referrer / Tracking-Kontext', 'DXRFR', 'DXRFR', 'Daxtra Capture', null, null, 'Moegliche Verwendung: UTM-, c-Parameter- oder trackingDomainGroupId-Kontext.', null, 'Review Required', null),
('dxbpi', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'IRIS-ID / BPID', 'DXBPI', 'DXBPI', 'Daxtra Capture', 'IRIS', null, 'Lookup und Update eines bestehenden Business Partners in IRIS.', null, 'Confirmed', null),
('dxpsf', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'PSO Flag', 'DXPSF', 'DXPSF', 'Daxtra Capture', null, null, '0 = Standard, 1 = PSO.', array['0=Standard','1=PSO'], 'Review Required', 'Review Required, bis technisch final bestaetigt.'),
('dxpsi', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'PSO ID', 'DXPSI', 'DXPSI', 'Daxtra Capture', null, null, 'Nicht mit PSO Flag verwechseln. Keine Beispiel-ID erfinden.', null, 'Review Required', null),
('dxaoe', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Fachgebiet / Area of Expertise', 'DXAOE', 'DXAOE', 'Daxtra Capture', null, null, 'Grundlage der BP-Bereichszuordnung. Beispiele nur verwenden, wenn im Projektkontext bestaetigt.', null, 'Review Required', null),
('dxemp', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Beschaeftigungsform / Employment Type', 'DXEMP', 'DXEMP', 'Daxtra Capture', null, null, 'Dokumentierte Werte: Contracting, Perm, Temp.', array['Contracting','Perm','Temp'], 'Review Required', null),
('dxavl', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Verfuegbarkeitsdatum', 'DXAVL', 'DXAVL', 'Daxtra Capture', null, null, 'Dokumentiertes Format: YYYY-MM-DD HH:MM:SS.', null, 'Review Required', null),
('dxpid', 'hays-talent-delivery', 'v1-2026-09', 'Website/EML', 'Prospect-ID(s)', 'DXPID', 'DXPID', 'Daxtra Capture', null, null, 'Bis zu zehn Werte im Importtool-Zielbild. Prospect-Nummer und interne Prospect-ID nicht gleichsetzen.', null, 'Review Required', null)
on conflict (id) do nothing;

-- --- Data Dictionary: G2 Daxtra-Capture-Standardfelder (IRIS-relevant) ---
insert into public.data_dictionary_entries (id, context_profile_id, data_dictionary_version, domain, display_name, technical_name, source_system, target_system, target_field, description, confirmation_status) values
('daxtra-first-name', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'First Name', 'First Name', 'Daxtra Capture', 'IRIS', 'IRIS Vorname', 'Standardfeld First Name.', 'Confirmed'),
('daxtra-last-name', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Last Name', 'Last Name', 'Daxtra Capture', 'IRIS', 'IRIS Name / Nachname', 'Standardfeld Last Name.', 'Confirmed'),
('daxtra-line1', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Line 1', 'Line 1', 'Daxtra Capture', 'IRIS', 'IRIS Strasse & Hausnummer', 'Adresszeile 1.', 'Confirmed'),
('daxtra-city', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'City', 'City', 'Daxtra Capture', 'IRIS', 'IRIS Ort', 'Ort.', 'Confirmed'),
('daxtra-postcode', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Postcode', 'Postcode', 'Daxtra Capture', 'IRIS', 'IRIS PLZ', 'Postleitzahl.', 'Confirmed'),
('daxtra-country', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Country', 'Country', 'Daxtra Capture', 'IRIS', 'IRIS Land', 'Land.', 'Confirmed'),
('daxtra-email1', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Email 1', 'Email 1', 'Daxtra Capture', 'IRIS', 'IRIS E-Mail Privat', 'Primaere E-Mail.', 'Confirmed'),
('daxtra-email2', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Email 2', 'Email 2', 'Daxtra Capture', 'IRIS', 'IRIS E-Mail Projekt', 'Sekundaere E-Mail.', 'Confirmed'),
('daxtra-mobile', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Mobile', 'Mobile', 'Daxtra Capture', 'IRIS', 'IRIS Mobiltelefon', 'Mobiltelefonnummer.', 'Confirmed'),
('daxtra-gender', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Gender', 'Gender', 'Daxtra Capture', 'IRIS', 'IRIS Geschlecht', 'Geschlecht laut Daxtra-Extraktion.', 'Review Required'),
('daxtra-nationality1', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Nationality 1', 'Nationality 1', 'Daxtra Capture', 'IRIS', 'IRIS Nationalitaet', 'Primaere Nationalitaet.', 'Confirmed'),
('daxtra-dob', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Date of Birth', 'Date of Birth', 'Daxtra Capture', 'IRIS', 'IRIS Geburtsdatum', 'Geburtsdatum.', 'Confirmed'),
('daxtra-skill-role', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra Standard', 'Skill / Role', 'Skill / Role', 'Daxtra Capture', 'IRIS', 'IRIS Skills und Rollen', 'Nur soweit im jeweiligen Prozess verwendet.', 'Review Required')
on conflict (id) do nothing;

-- --- Data Dictionary: G3 Hays-spezifische Daxtra User Fields ---
insert into public.data_dictionary_entries (id, context_profile_id, data_dictionary_version, domain, display_name, technical_name, source_system, target_system, target_field, description, confirmation_status) values
('x-availability-date', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Verfuegbarkeitsdatum', 'xavailability_date', 'Daxtra Capture', 'IRIS', 'IRIS Verfuegbarkeit', 'Verfuegbarkeitsdatum des Kandidaten.', 'Confirmed'),
('x-email-from', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'E-Mail-Absender des Daxtra-Auftrags', 'XEMAIL_FROM', 'Daxtra Capture', null, null, 'Absenderadresse des verarbeitenden Auftrags.', 'Confirmed'),
('x-from-address', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Absenderadresse des Daxtra-Auftrags', 'XFROM_ADDRESS', 'Daxtra Capture', null, null, 'Absenderadresse.', 'Confirmed'),
('x-from-name', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Name des Erstellers', 'XFROM_NAME', 'Daxtra Capture', null, null, 'Name des Erstellers des Auftrags.', 'Confirmed'),
('x-focus-area', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Default-Schwerpunkt', 'XFOCUS_AREA', 'Daxtra Capture', 'IRIS', 'IRIS Schwerpunkt', 'Default-Schwerpunkt.', 'Confirmed'),
('x-job-board-id', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Prospect-Nummer', 'xjob_board_id', 'Daxtra Capture', null, null, 'Review Required, falls im Zielprojekt eine interne Prospect-ID statt Nummer erwartet wird.', 'Review Required'),
('x-job-id', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Prospect-Nummer', 'xjob_id', 'Daxtra Capture', null, null, 'Review Required.', 'Review Required'),
('x-linkedin-url', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'LinkedIn-URL des Kandidaten', 'XLINKEDIN_URL', 'Daxtra Capture', null, null, 'LinkedIn-URL, falls vorhanden.', 'Confirmed'),
('x-source', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Trackinginformation der Bewerbung', 'xsource', 'Daxtra Capture', null, null, 'Moegliche IRIS-Ziele projektbezogen bestaetigen.', 'Review Required'),
('x-spool-data', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Daxtra Spool-Spezifika', 'XSPOOL_DATA', 'Daxtra Capture', null, null, 'Spool-Spezifika.', 'Confirmed'),
('x-spool-name', 'hays-talent-delivery', 'v1-2026-09', 'Daxtra User Field', 'Verwendeter Daxtra Spool', 'XSPOOL_NAME', 'Daxtra Capture', null, null, 'Verwendeter Spool-Name.', 'Confirmed')
on conflict (id) do nothing;

-- --- Data Dictionary: G4 IRIS-Objekte + G5 Freelancermap/Quick-Apply API-Felder ---
insert into public.data_dictionary_entries (id, context_profile_id, data_dictionary_version, domain, display_name, technical_name, source_system, target_system, description, confirmation_status) values
('iris-business-partner', 'hays-talent-delivery', 'v1-2026-09', 'IRIS', 'Business Partner / BP', 'IRIS_BP', null, 'IRIS', 'Zentrales Kandidatenobjekt in IRIS.', 'Confirmed'),
('iris-bpid', 'hays-talent-delivery', 'v1-2026-09', 'IRIS', 'IRIS-ID / BPID', 'IRIS_BPID', null, 'IRIS', 'Eindeutiger Identifier des Business Partners.', 'Confirmed'),
('api-header-id', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Header.Id', 'Header.Id', 'Freelancermap', null, 'UUID-basierte Correlation-/Conversation-ID laut ATSi-V4-Kontext.', 'Confirmed'),
('api-header-jobboardid', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Header.JobBoardId', 'Header.JobBoardId', 'Freelancermap', null, 'Finaler Wert muss im Hays-Projektkontext bestaetigt werden.', 'Review Required'),
('api-header-jobboardname', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Header.JobBoardName', 'Header.JobBoardName', 'Freelancermap', null, 'Name des Jobboards.', 'Confirmed'),
('api-header-originalurl', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Header.OriginalUrl', 'Header.OriginalUrl', 'Freelancermap', null, 'Darf nicht mit erfundenen URLs gefuellt werden.', 'Confirmed'),
('api-header-effectiveurl', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Header.EffectiveUrl', 'Header.EffectiveUrl', 'Freelancermap', null, 'Darf nicht mit erfundenen URLs gefuellt werden.', 'Confirmed'),
('api-header-atsiapplicationid', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Header.AtsiApplicationId', 'Header.AtsiApplicationId', 'Freelancermap', null, 'Nur verwenden, wenn das finale Hays-Mapping dies bestaetigt.', 'Review Required'),
('api-body-email', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Body.Email', 'Body.Email', 'Freelancermap', null, 'E-Mail-Adresse im Bewerbungs-Body.', 'Confirmed'),
('api-body-firstname', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Body.FirstName', 'Body.FirstName', 'Freelancermap', null, 'Vorname im Bewerbungs-Body.', 'Confirmed'),
('api-body-surname', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Body.Surname', 'Body.Surname', 'Freelancermap', null, 'Nachname im Bewerbungs-Body.', 'Confirmed'),
('api-body-mobile', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Body.Mobile', 'Body.Mobile', 'Freelancermap', null, 'Mobiltelefonnummer im Bewerbungs-Body.', 'Confirmed'),
('api-body-cv', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Body.CV', 'Body.CV', 'Freelancermap', null, 'Im generischen V4-Contract erforderlich.', 'Confirmed'),
('api-body-coverletter', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Body.CoverLetter', 'Body.CoverLetter', 'Freelancermap', null, 'Nur gemaess bestaetigtem Dokumentvertrag erwarten.', 'Review Required'),
('api-body-additionaldocuments', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'Body.AdditionalDocuments', 'Body.AdditionalDocuments', 'Freelancermap', null, 'Nur gemaess bestaetigtem Dokumentvertrag erwarten.', 'Review Required'),
('api-doc-binarydata', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'BinaryData', 'BinaryData', 'Freelancermap', null, 'Base64-Dateiinhalt.', 'Confirmed'),
('api-doc-filetype', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'FileType', 'FileType', 'Freelancermap', null, 'Getrennt von FileName zu pruefen.', 'Confirmed'),
('api-doc-filename', 'hays-talent-delivery', 'v1-2026-09', 'Freelancermap API', 'FileName', 'FileName', 'Freelancermap', null, 'Getrennt von FileType zu pruefen.', 'Confirmed')
on conflict (id) do nothing;

-- --- Kontrollierte Wertelisten (H1-H18) ---
insert into public.controlled_value_sets (key, version, label, values, multi_select, required, applicable_projects, confirmation_status) values
('SYSTEM', 'v1-2026-09', 'System', array['Hays Webseite','MeinHays','Freelancermap','Hays Web/API','global-quick-apply-service','Daxtra Capture','IRIS','Azure DevOps','Monitoring / Logs'], true, true, array['hays-talent-delivery'], 'Confirmed'),
('ENVIRONMENT', 'v1-2026-09', 'Environment', array['Development','INT','Test','PreProd','Production / Live'], false, true, array['hays-talent-delivery','general'], 'Confirmed'),
('APPLICATION_FLOW', 'v1-2026-09', 'Bewerbungsweg', array['Standardbewerbung','PSO-Bewerbung','Profilpflege / Profile Update','Freelancermap API Bewerbung','E-Mail-Bewerbung','CV-Rescan'], false, true, array['hays-talent-delivery'], 'Confirmed'),
('SUBMISSION_TYPE', 'v1-2026-09', 'Submission Type', array['application','pso_application','profile_update'], false, false, array['hays-talent-delivery'], 'Review Required'),
('DAXTRA_STATUS', 'v1-2026-09', 'Daxtra Status', array['Successfully loaded','Successfully updated','Missing Information','Possible Update','Failed to Load'], true, false, array['hays-talent-delivery'], 'Confirmed'),
('IRIS_OUTCOME', 'v1-2026-09', 'IRIS-Ergebnis', array['BP neu angelegt','Bestehender BP aktualisiert','Bewerbung dem Prospect zugeordnet','Kontakt angelegt','Journal angelegt','Dokument / O-Profil vorhanden','Manuelle Pruefung erforderlich','Keine Neuanlage','Keine Aenderung'], true, false, array['hays-talent-delivery'], 'Confirmed'),
('MATCHING_RESULT', 'v1-2026-09', 'Matching-Ergebnis', array['BPID eindeutig gefunden','Eindeutiger Treffer ueber Vorname, Nachname und E-Mail','Kein Treffer','Mehrfachtreffer','GDPR Lock / nicht verarbeitbar','GDPR Delete / Regel zu bestaetigen'], false, false, array['hays-talent-delivery'], 'Confirmed'),
('DOCUMENT_ROLE', 'v1-2026-09', 'Dokumentrolle', array['CV / Haupt-CV','CoverLetter / Anschreiben','AdditionalDocument / Zusatzdokument','O-Profil','Daxtra Original Email','Nicht klassifiziert'], true, false, array['hays-talent-delivery'], 'Confirmed'),
('FILE_TYPE', 'v1-2026-09', 'Dateityp', array['doc','docx','odt','pdf','rtf','txt','jpeg','jpg','png'], true, false, array['hays-talent-delivery'], 'Confirmed'),
('EMPLOYMENT_TYPE', 'v1-2026-09', 'Beschaeftigungsform', array['Contracting','Perm','Temp'], false, false, array['hays-talent-delivery'], 'Review Required'),
('PSO_FLAG', 'v1-2026-09', 'PSO Flag', array['0 = Standard','1 = PSO'], false, false, array['hays-talent-delivery'], 'Review Required'),
('COUNTRY_SOURCE', 'v1-2026-09', 'Country Source', array['DE','AT','CH','DK'], false, false, array['hays-talent-delivery'], 'Confirmed'),
('TEST_TYPE', 'v1-2026-09', 'Testtyp', array['Readiness','Smoke','Functional','Integration','API','E2E','Regression','Negative','Boundary','Security','Resilience','Cutover','Rollback'], true, false, array['hays-talent-delivery','general'], 'Confirmed'),
('PRIORITY', 'v1-2026-09', 'Prioritaet', array['Critical','High','Medium','Low'], false, true, array['hays-talent-delivery','general'], 'Confirmed'),
('CASE_STATUS', 'v1-2026-09', 'Case Status', array['Draft','NotStarted','InProgress','Passed','Failed','Blocked'], false, true, array['hays-talent-delivery','general'], 'Confirmed'),
('EVIDENCE', 'v1-2026-09', 'Evidence', array['Screenshot','Request Payload','Response Payload','HAR','Browser Console Log','Service Log','Daxtra Docket-ID','IRIS-ID / BPID','Prospect-ID','PSO-ID','Timestamp','Correlation-ID'], true, false, array['hays-talent-delivery','general'], 'Confirmed'),
('READINESS', 'v1-2026-09', 'Readiness', array['Confirmed','Conditional Ready','Draft / Blocked'], false, true, array['hays-talent-delivery','general'], 'Confirmed'),
('OWNER_DOMAIN', 'v1-2026-09', 'Owner Domain', array['Business / Talent Delivery','Hays Web/API','IRIS','Daxtra','Freelancermap / KESI','Security','Data Protection / Legal','Operations / IAS'], false, false, array['hays-talent-delivery'], 'Confirmed'),
('IRIS_FIELD', 'v1-2026-09', 'IRIS-Pruffeld', array['Business Partner / BP','IRIS-ID / BPID','Vorname','Name / Nachname','Geschlecht','BP-Sprache','Strasse & Hausnummer','PLZ','Ort','Land','E-Mail Privat','E-Mail Projekt','Mobiltelefon','Nationalitaet','Geburtsdatum','Verfuegbarkeit','Verfuegbarkeit in %','Schwerpunkt','BP-Bereich','Erstkontaktart','Marketingaktivitaet','Bewerbung','Prospect-Zuordnung','Kontakte','Journal','Dokument / O-Profil','Skills','Rollen','GDPR Lock','GDPR Delete'], true, false, array['hays-talent-delivery'], 'Confirmed')
on conflict (key, version) do nothing;

-- --- Terminologieregeln (Abschnitt L) ---
insert into public.terminology_rules (id, context_profile_id, forbidden_term, replacement_guidance, context_condition, severity) values
('term-ats', 'hays-talent-delivery', 'ATS', 'IRIS, wenn IRIS das Zielsystem ist', 'IRIS ist Zielsystem', 'error'),
('term-candidate-record', 'hays-talent-delivery', 'Candidate Record', 'Business Partner (BP) oder IRIS Kandidatendatensatz', null, 'error'),
('term-application-record', 'hays-talent-delivery', 'Application Record', 'Bewerbung oder Prospect-Zuordnung', null, 'error'),
('term-downstream-handover', 'hays-talent-delivery', 'Downstream Handover', 'Konkreter Daxtra-Status oder bestaetigte fachliche Beschreibung; kein erfundener Logtext.', null, 'error'),
('term-app-id', 'hays-talent-delivery', 'APP-', 'Nur verwenden, wenn im Data Dictionary bestaetigte ID-Konvention; sonst Request-/Correlation-ID referenzieren.', null, 'error'),
('term-processed-successfully', 'hays-talent-delivery', 'processed successfully', 'Konkreter bestaetigter Daxtra-Status bzw. IRIS-Ergebnis statt generischer Erfolgsmeldung.', null, 'error'),
('term-system-status', 'hays-talent-delivery', 'system status', 'Konkreter Daxtra-Status oder IRIS-Ergebnis.', null, 'warning'),
('term-manual-queue', 'hays-talent-delivery', 'manual queue', 'Konkreter Daxtra-Status (z.B. Missing Information) oder bestaetigter manueller Pruefpfad.', null, 'warning'),
('term-category', 'hays-talent-delivery', 'Category', 'Fachgebiet, Beschaeftigungsform oder BP-Bereich, abhaengig vom Kontext.', null, 'warning'),
('term-reference-id', 'hays-talent-delivery', 'Reference ID', 'Konkreter ID-Typ: IRIS-ID/BPID, Prospect-Nummer, Prospect-ID, PSO-ID, Daxtra Docket-ID oder Request-/Correlation-ID.', null, 'warning'),
('term-success', 'hays-talent-delivery', 'Success', 'Konkreter Objekt- und Feldzustand statt generischem "Success".', null, 'info')
on conflict (id) do nothing;

-- --- Routingregeln (Importtool-Ablösung) ---
insert into public.routing_rules (id, context_profile_id, process_key, description, target_mailbox, target_spool_label, mandatory_rule, confirmation_status) values
('route-standardbewerbung', 'hays-talent-delivery', 'standardbewerbung', 'Standardbewerbung wird an die Standard-Parsing-Mailbox geroutet.', 'Parsing_Inbound@hays.de', 'Standard-Spool', null, 'Confirmed'),
('route-pso-bewerbung', 'hays-talent-delivery', 'pso-bewerbung', 'PSO-Bewerbung wird an die PSO-Parsing-Mailbox geroutet. PSO Flag und PSO ID nicht verwechseln.', 'PM.PSO-Parsing@hays.de', 'PSO-Spool', null, 'Confirmed'),
('route-profilpflege', 'hays-talent-delivery', 'profilpflege', 'Profilpflege ist update-only und darf ohne matchbaren bestehenden BP keine Neuanlage ausloesen.', 'PM.Profilpflege-Parsing@hays.de', 'Profilpflege-Spool', 'update-only', 'Confirmed')
on conflict (id) do nothing;
