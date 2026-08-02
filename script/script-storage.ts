import { enqueue, getNext, markDone, markFailed, list } from '../src/queue/queue';

enqueue({ url: 'https://sucesso.com' });
enqueue({ url: 'https://falha.com' });

// simula processar o primeiro (sucesso)
const job1 = getNext();
console.log('Pegou:', job1?.url, job1?.status); // deve ser 'running'
if (job1) markDone(job1.id);

// simula processar o segundo, falhando 3 vezes (max_attempts default = 3)
for (let i = 0; i < 3; i++) {
  const job2 = getNext();
  if (job2) {
    console.log(`Tentativa ${i + 1}:`, job2.url);
    markFailed(job2.id, 'timeout simulado');
  }
}

console.log('Estado final da fila:', list());