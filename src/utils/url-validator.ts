export function validateUrl(input: string): URL {
  try {
    const url = new URL(input);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`Protocolo não suportado: "${url.protocol}". Use http ou https.`);
    }

    return url;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`URL inválida: "${input}". Exemplo: https://example.com`);
    }
    throw error;
  }
}

export function extractDomain(url: URL): string {
  return url.hostname.replace(/^www\./, '');
}
