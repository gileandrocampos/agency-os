import { enqueue, getNext, markDone, markFailed, list } from '../src/queue/queue';
import { logQueue } from '../src/logger';

enqueue({ url: 'https://sucesso.com' });
enqueue({ url: 'https://falha.com' });

// simula processar o primeiro (sucesso)
const job1 = getNext();
logQueue(`Pegou: ${job1?.url ?? '-'} (${job1?.status ?? '-'})`);
if (job1) markDone(job1.id);

// simula processar o segundo, falhando até atingir max_attempts
for (let i = 0; i < 1; i++) {
  const job2 = getNext();
  if (job2) {
    logQueue(`Tentativa ${i + 1}: ${job2.url}`);
    markFailed(job2.id, 'timeout simulado');
  }
}

logQueue(`Estado final da fila: ${JSON.stringify(list())}`);