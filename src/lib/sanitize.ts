import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked options with raw HTML disabled
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(rawText: string): string {
  if (!rawText) return '';

  // Parse markdown to HTML
  const rawHtml = marked.parse(rawText, { async: false }) as string;

  // Sanitize with DOMPurify: raw HTML tags like script, iframe, object stripped
  // Links restricted only to http, https, and mailto
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p',
      'strong',
      'em',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'br',
      'hr',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });

  return cleanHtml;
}
