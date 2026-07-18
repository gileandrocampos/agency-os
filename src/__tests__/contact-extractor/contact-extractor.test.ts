import { describe, it, expect } from 'vitest';
import { extractContacts } from '../../contact-extractor';

describe('ContactExtractor', () => {
  it('extrai contatos, whatsapp, email, redes sociais, mapas, horarios e ctas', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "address": {
                "streetAddress": "Rua das Flores, 100",
                "addressLocality": "Sao Paulo",
                "addressRegion": "SP",
                "postalCode": "01000-000",
                "addressCountry": "BR"
              },
              "openingHours": ["Mo-Fr 08:00-18:00"]
            }
          </script>
        </head>
        <body>
          <a href="tel:+55 (11) 99999-9999">Ligar</a>
          <a href="mailto:contato@example.com">Email</a>
          <a href="https://wa.me/5511999999999">WhatsApp</a>
          <a href="https://instagram.com/agencia">Instagram</a>
          <a href="https://maps.google.com/?q=-23.5505,-46.6333">Mapa</a>
          <footer>Rua das Flores, 100 - Sao Paulo - SP - 01000-000</footer>
          <div>Segunda a Sexta 08:00 as 18:00</div>
          <form action="/contato" method="post">
            <input name="name" required />
            <input name="email" required />
          </form>
          <a href="/contato">Fale conosco</a>
          <section>Filial Centro: Rua B, 50</section>
        </body>
      </html>
    `;

    const result = extractContacts({ html, baseUrl: 'https://example.com' });

    expect(result.phones).toContainEqual({
      raw: '+55 (11) 99999-9999',
      normalized: '+5511999999999',
      source: 'href',
      confidence: 'high',
    });
    expect(result.whatsapp).toContainEqual({
      url: 'https://wa.me/5511999999999',
      phone: '+5511999999999',
      source: 'href',
      confidence: 'high',
    });
    expect(result.emails).toContainEqual({
      email: 'contato@example.com',
      source: 'href',
      confidence: 'high',
    });
    expect(result.socialProfiles).toContainEqual({
      platform: 'instagram',
      url: 'https://instagram.com/agencia',
      handle: 'agencia',
    });
    expect(result.maps[0]?.coordinates).toEqual({ lat: -23.5505, lng: -46.6333 });
    expect(result.businessHours).toContainEqual({ text: 'Mo-Fr 08:00-18:00', source: 'schema' });
    expect(result.forms).toContainEqual({
      action: '/contato',
      method: 'POST',
      requiredFields: 2,
      fieldNames: ['name', 'email'],
      hasCaptcha: false,
    });
    expect(result.ctas).toContainEqual({ text: 'Fale conosco', href: '/contato' });
    expect(result.branches.length).toBeGreaterThan(0);
  });

  it('remove duplicidades de telefones e emails', () => {
    const html = `
      <body>
        <a href="tel:+55 11 99999-9999">Telefone</a>
        <a href="tel:+55 11 99999-9999">Telefone 2</a>
        <a href="mailto:contato@example.com">Email</a>
        <a href="mailto:contato@example.com">Email 2</a>
      </body>
    `;

    const result = extractContacts({ html, baseUrl: 'https://example.com' });

    expect(result.phones).toHaveLength(1);
    expect(result.emails).toHaveLength(1);
  });
});
