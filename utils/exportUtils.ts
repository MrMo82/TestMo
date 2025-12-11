
import { TestCase } from '../types';

export const exportCasesToCSV = (cases: TestCase[]) => {
  const headers = [
    'Case ID',
    'Titel',
    'Priorität',
    'Status',
    'Erstellt von',
    'Schritt Nr',
    'Schritt Beschreibung',
    'Erwartetes Ergebnis',
    'Testdaten',
    'Schritt Status',
    'Notizen',
    'Zuletzt Aktualisiert',
    'Meta Daten' // Added Column
  ];

  const rows: string[] = [];
  rows.push(headers.join(';')); 

  cases.forEach(testCase => {
    // Serialize Meta for CSV
    const metaString = testCase.meta 
        ? Object.entries(testCase.meta).map(([k,v]) => `${k}:${v}`).join('|')
        : '';

    testCase.steps.forEach(step => {
      const rowData = [
        testCase.caseId,
        `"${testCase.title.replace(/"/g, '""')}"`, 
        testCase.priority,
        testCase.caseStatus,
        testCase.createdBy,
        step.sequence.toString(),
        `"${step.description.replace(/"/g, '""')}"`,
        `"${step.expectedResult.replace(/"/g, '""')}"`,
        `"${(step.testData || '').replace(/"/g, '""')}"`,
        step.status,
        `"${(step.notes || '').replace(/"/g, '""')}"`,
        testCase.lastUpdated,
        `"${metaString}"`
      ];
      rows.push(rowData.join(';'));
    });
  });

  downloadCSV(rows.join('\n'), 'TestMo_Standard_Export');
};

export const exportForZephyr = (cases: TestCase[]) => {
  // Zephyr Import typically needs: Name, Step, Result, TestData, ExternalID, etc.
  // We align with the "Discriminator = Name" logic
  
  const headers = [
    'Name', // Discriminator
    'Step',
    'Result',
    'TestData',
    'ExternalID', // caseId
    'Description', // Case Summary/Preconditions + META
    'Tags' // Also export tags for filtering
  ];

  const rows: string[] = [];
  rows.push(headers.join(';'));

  cases.forEach(testCase => {
    testCase.steps.forEach((step, index) => {
      // Logic: Name is repeated for each step so importer knows they belong together
      // Description is usually only needed on the first row, but repeating is safer for some importers
      
      const preconditions = testCase.preconditions.length ? `\n\nPreconditions:\n- ${testCase.preconditions.join('\n- ')}` : '';
      
      // Serialize Meta for Description field (Zephyr compatible text)
      const metaDesc = testCase.meta
        ? `\n\nCMP Dimensions:\n` + Object.entries(testCase.meta)
            .map(([k,v]) => `${k}: ${v}`)
            .join('\n')
        : '';

      const fullDescription = `${testCase.summary}${preconditions}${metaDesc}`;
      const tagsString = (testCase.tags || []).join(',');

      const rowData = [
        `"${testCase.title.replace(/"/g, '""')}"`, // Name acts as discriminator
        `"${step.description.replace(/"/g, '""')}"`, // Step Action
        `"${step.expectedResult.replace(/"/g, '""')}"`, // Expected Result
        `"${(step.testData || '').replace(/"/g, '""')}"`, // Test Data
        testCase.caseId,
        index === 0 ? `"${fullDescription.replace(/"/g, '""')}"` : "", // Description with Meta
        index === 0 ? `"${tagsString}"` : ""
      ];
      rows.push(rowData.join(';'));
    });
  });

  downloadCSV(rows.join('\n'), 'TestMo_Zephyr_Import');
}

const downloadCSV = (content: string, filenamePrefix: string) => {
    const csvContent = "\uFEFF" + content; // BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
