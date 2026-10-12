import { db } from '../src/queue/storage';
import { logQueue } from '../src/logger';

db.exec('DELETE FROM jobs');
logQueue('Fila limpa.');