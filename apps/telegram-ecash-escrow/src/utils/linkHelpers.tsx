import { isSafeImageUrl, parseSafeHttpUrl } from '@/src/utils';

// Split regex (capturing) — non-global to avoid RegExp.state issues.
const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/i;

export function renderTextWithLinks(text?: string | null, options: { loadImages?: boolean } = {}) {
  if (!text) return null;
  const parts = text.split(URL_SPLIT_REGEX);
  return (
    <>
      {parts.map((part, idx) => {
        if (idx % 2 === 1) {
          const rawUrl = part.trim();
          const parsed = parseSafeHttpUrl(rawUrl);
          if (!parsed) return <span key={idx}>{rawUrl}</span>;
          const safe = parsed.href; // URL.href is already normalized
          if (isSafeImageUrl(parsed)) {
            if (options.loadImages) {
              return (
                <a key={idx} href={safe} target="_blank" rel="noreferrer noopener" onClick={e => e.stopPropagation()}>
                  <img
                    src={safe}
                    alt="attachment"
                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, display: 'block', marginTop: 8 }}
                    loading="lazy"
                  />
                </a>
              );
            }

            return (
              <a
                key={idx}
                href={safe}
                target="_blank"
                rel="noreferrer noopener"
                onClick={e => e.stopPropagation()}
                style={{ color: '#1976d2' }}
              >
                View image
              </a>
            );
          }

          return (
            <a
              key={idx}
              href={safe}
              target="_blank"
              rel="noreferrer noopener"
              onClick={e => e.stopPropagation()}
              style={{ color: '#1976d2' }}
            >
              {safe}
            </a>
          );
        }

        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

export default renderTextWithLinks;
