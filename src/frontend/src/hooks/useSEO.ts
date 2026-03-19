import { useEffect } from "react";

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
}

function setMeta(selector: string, content: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    const attr = selector.startsWith("meta[property") ? "property" : "name";
    const val = selector.match(/["']([^"']+)["']/)?.[1] ?? "";
    el.setAttribute(attr, val);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO(config: SEOConfig) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time SEO setup on mount
  useEffect(() => {
    const {
      title,
      description,
      keywords,
      canonical,
      robots = "index, follow",
      ogTitle,
      ogDescription,
      ogUrl,
    } = config;

    document.title = title;

    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', robots);

    if (keywords) {
      setMeta('meta[name="keywords"]', keywords);
    }

    setLink("canonical", canonical);

    setMeta('meta[property="og:title"]', ogTitle ?? title);
    setMeta('meta[property="og:description"]', ogDescription ?? description);
    setMeta('meta[property="og:url"]', ogUrl ?? canonical);
    setMeta('meta[property="og:type"]', "website");

    setMeta('meta[name="twitter:title"]', ogTitle ?? title);
    setMeta('meta[name="twitter:description"]', ogDescription ?? description);

    return () => {
      document.title = "Aldotelico | Desarrollo de Software en Málaga";
    };
  }, []);
}
