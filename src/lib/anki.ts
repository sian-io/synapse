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
      const answerPart = (c.answer || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
      const keyConceptPart = c.keyConcept ? `<b>Concept:</b> ${c.keyConcept.replace(/\t/g, ' ')}` : '';
      const tipPart = c.neuroTip ? `<i>NeuroTip:</i> ${c.neuroTip.replace(/\t/g, ' ')}` : '';

      const extraDetails = [keyConceptPart, tipPart].filter(Boolean).join('<br><br>');
      const back = extraDetails ? `${answerPart}<br><br>${extraDetails}` : answerPart;

      const tag = (c.topic || 'synapse').trim().replace(/[\s\t]+/g, '_');
      return `${front}\t${back}\t${tag}`;
    })
    .join('\n');
}
