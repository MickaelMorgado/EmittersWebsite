'use client';

const schemaData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Emitters",
  url: "https://emitters.app",
  description: "Free developer tools and web applications",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://emitters.app/{search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export function JsonLdSchema() {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}