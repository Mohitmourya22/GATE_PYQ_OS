import katex from 'katex'

/**
 * Renders text exactly as stored. Only segments written as $...$ (LaTeX) are typeset with KaTeX.
 * (The supplied dataset currently contains no $...$ segments, so nothing is altered.)
 */
export default function RichText({ text, className = '' }: { text: string; className?: string }) {
  const segs = text.split(/(\$[^$]+\$)/g)
  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {segs.map((s, i) => {
        if (s.length > 2 && s.startsWith('$') && s.endsWith('$')) {
          const html = katex.renderToString(s.slice(1, -1), { throwOnError: false })
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        }
        return <span key={i}>{s}</span>
      })}
    </span>
  )
}
