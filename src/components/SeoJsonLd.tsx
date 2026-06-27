import { FAQS, SITE } from '../constants/content'

// GEO/SEO 구조화 데이터 (JSON-LD). AI·검색이 ONDO를 정확히 인용하도록.
export function SeoJsonLd() {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ONDO',
      url: SITE.url,
      description: SITE.description,
      sameAs: ['https://instagram.com/ondo.pm'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'ONDO 러닝메이트 매칭',
      serviceType: '소규모 러닝메이트 매칭',
      areaServed: { '@type': 'City', name: '서울' },
      description: SITE.definition,
      provider: { '@type': 'Organization', name: 'ONDO' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  return (
    <script
      type="application/ld+json"
      // 정적 콘텐츠라 XSS 위험 없음
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
