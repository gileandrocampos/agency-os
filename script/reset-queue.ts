// scripts/reset-queue.ts
import { db } from '../src/queue/storage';
db.exec('DELETE FROM jobs');
console.log('Fila limpa.');