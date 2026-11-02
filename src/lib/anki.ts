import type { Flashcard } from '../types';

function escapeCsvField(val: string): string {
  const str = String(val ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateFlashcardsCsv(cards: Flashcard[], isPt = false): string {
  const header = isPt ? 'Pergunta,Resposta,Tópico' : 'Question,Answer,Topic';
  const rows = cards.map((c) => {
    const question = escapeCsvField(c.question);
    const answer = escapeCsvField(c.answer);
    const topic = escapeCsvField(c.topic || 'synapse');
    return `${question},${answer},${topic}`;
  });
  return [header, ...rows].join('\r\n');
}

export function generateAnkiTsv(cards: Flashcard[]): string {
  return cards
    .map((c) => {
      const front = (c.question || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
      const back = (c.answer || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
      const tag = (c.topic || 'synapse').trim().replace(/[\s\t]+/g, '_');
      return `${front}\t${back}\t${tag}`;
    })
    .join('\n');
}

function parseCsvRows(text: string, delimiter: ',' | '\t'): string[][] {
  if (delimiter === '\t') {
    return text
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.split('\t'));
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField);
      currentField = '';
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else if (ch === '\n') {
      currentRow.push(currentField);
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  currentRow.push(currentField);
  if (currentRow.some((cell) => cell.trim().length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function unpackAnkiBackField(rawBack: string): {
  answer: string;
} {
  let working = rawBack;

  // Tolerant stripping of legacy Anki tags if present in older exports
  working = working.replace(/(?:<br\s*\/?>)*\s*<i>NeuroTip:<\/i>\s*[\s\S]*?$/i, '');
  working = working.replace(/(?:<br\s*\/?>)*\s*<b>Concept:<\/b>\s*[\s\S]*?$/i, '');

  const answer = working.replace(/<br\s*\/?>/gi, '\n').trim();
  return { answer };
}

export function parseFlashcardsImport(
  rawText: string,
  filename = '',
  now = Date.now()
): Flashcard[] {
  const cleanText = String(rawText ?? '').replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const isTsvByExt = filename.toLowerCase().endsWith('.tsv');
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const delimiter: ',' | '\t' = isTsvByExt || firstLine.includes('\t') ? '\t' : ',';

  const rows = parseCsvRows(cleanText, delimiter);
  if (rows.length === 0) return [];

  const firstRow = rows[0].map((c) => c.trim().toLowerCase());
  const isHeaderRow =
    (firstRow[0] === 'pergunta' || firstRow[0] === 'question' || firstRow[0] === 'front') &&
    (firstRow[1] === 'resposta' || firstRow[1] === 'answer' || firstRow[1] === 'back');

  const dataRows = isHeaderRow ? rows.slice(1) : rows;
  const cards: Flashcard[] = [];

  dataRows.forEach((cols, idx) => {
    const rawQuestion = (cols[0] ?? '').replace(/<br\s*\/?>/gi, '\n').trim();
    const rawBack = (cols[1] ?? '').trim();
    const rawTopic = (cols[2] ?? '').trim();

    if (!rawQuestion || !rawBack) return;

    const { answer } =
      delimiter === '\t'
        ? unpackAnkiBackField(rawBack)
        : { answer: rawBack };

    if (!answer) return;

    const normalizedTopic =
      delimiter === '\t' && rawTopic && !rawTopic.includes(' ')
        ? rawTopic.replace(/_/g, ' ')
        : rawTopic || 'synapse';

    cards.push({
      id: `fc_imp_${now}_${idx}`,
      topic: normalizedTopic,
      question: rawQuestion,
      answer,
    });
  });

  return cards;
}
