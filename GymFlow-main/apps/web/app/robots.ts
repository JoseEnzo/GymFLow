import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://gymflow.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacidade', '/termos'],
        disallow: ['/dashboard', '/alunos', '/treinos', '/personais', '/configuracoes', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
