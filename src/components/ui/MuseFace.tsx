export type MuseState = 'idle' | 'listening' | 'thinking'

// The muse: a Cubist portrait, one half seen from the front, one in profile.
// It blinks when idle, shows sound waves while listening, and shifts its
// planes while thinking.
export default function MuseFace({
  size = 48,
  state = 'idle',
  className = '',
}: {
  size?: number
  state?: MuseState
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`muse-face shrink-0 overflow-visible ${className}`}
      data-state={state}
      aria-hidden
      stroke="#17150f"
      strokeWidth={4.5}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* neck */}
      <path d="M84 158 L82 194 L128 194 L122 156 Z" fill="#5f7a4f" />
      {/* hair */}
      <path
        className="mf-part mf-hair"
        d="M46 90 C38 46 76 16 114 20 C152 24 174 56 166 96 L142 76 L100 66 L62 82 Z"
        fill="#e9b23c"
      />
      <g className="mf-part mf-left">
        {/* frontal half */}
        <path d="M62 82 L100 66 L100 174 C78 172 58 152 54 124 C52 106 56 92 62 82 Z" fill="#eba59c" />
        <circle cx="72" cy="136" r="8" fill="#d4553a" stroke="none" opacity="0.55" />
        <path d="M66 98 Q80 88 94 95" fill="none" />
        <g className="mf-part mf-eye">
          <path d="M67 112 Q80 99 95 112 Q80 122 67 112 Z" fill="#fbf8f1" />
          <circle className="mf-part mf-pupil" cx="81" cy="111.5" r="5" fill="#17150f" stroke="none" />
        </g>
      </g>
      <g className="mf-part mf-right">
        {/* profile half, nose jutting out */}
        <path d="M100 66 L142 76 C152 90 156 102 152 112 L170 130 L152 136 C152 158 134 172 100 174 Z" fill="#2346b5" />
        <path d="M112 92 L140 97" fill="none" stroke="#fbf8f1" strokeWidth={3.5} />
        <g className="mf-part mf-eye">
          <path d="M113 104 L138 108 L116 117 Z" fill="#fbf8f1" />
          <circle className="mf-part mf-pupil" cx="122" cy="109" r="4" fill="#17150f" stroke="none" />
        </g>
      </g>
      {/* nose seam */}
      <path d="M100 116 L109 138 L98 142" fill="none" />
      {/* split mouth */}
      <g className="mf-part mf-mouth">
        <path d="M80 154 Q90 147 100 151 Q112 147 122 154 Q111 163 100 160 Q89 163 80 154 Z" fill="#d4553a" />
        <path d="M81 154 L121 154" fill="none" strokeWidth={3} />
      </g>
      {/* listening waves */}
      <g className="mf-waves" fill="none" strokeWidth={4}>
        <path className="mf-wave" d="M180 108 Q189 128 180 148" />
        <path className="mf-wave" d="M192 98 Q205 128 192 158" />
      </g>
    </svg>
  )
}
