import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../queue', () => ({
  enqueue: vi.fn(),
}));

import { enqueue } from '../../queue';
import { enqueueSitesUseCase } from '../../application/enqueue-sites.usecase';

describe('enqueueSitesUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chama enqueue para cada URL informada', () => {
    (enqueue as ReturnType<typeof vi.fn>).mockReturnValue({ created: true, job: {} });

    enqueueSitesUseCase({ urls: ['https://a.com', 'https://b.com'] });

    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenCalledWith({ url: 'https://a.com' });
    expect(enqueue).toHaveBeenCalledWith({ url: 'https://b.com' });
  });

  it('retorna o resultado de cada enqueue na mesma ordem', () => {
    const resultA = { created: true, job: { url: 'https://a.com' } };
    const resultB = { created: false, reason: 'duplicate', existingJob: { url: 'https://b.com' } };
    (enqueue as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(resultA)
      .mockReturnValueOnce(resultB);

    const results = enqueueSitesUseCase({ urls: ['https://a.com', 'https://b.com'] });

    expect(results[0]).toBe(resultA);
    expect(results[1]).toBe(resultB);
  });

  it('retorna lista vazia quando nenhuma URL é informada', () => {
    expect(enqueueSitesUseCase({ urls: [] })).toEqual([]);
  });
});
