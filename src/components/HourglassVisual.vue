<template>
  <svg
    class="hourglass-visual"
    viewBox="0 0 420 420"
    role="img"
    aria-label="发光沙漏中沙粒持续流动的动画"
  >
    <defs>
      <linearGradient id="glassEdge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#74fff0" stop-opacity=".88" />
        <stop offset=".48" stop-color="#a78bfa" stop-opacity=".96" />
        <stop offset="1" stop-color="#55d8ff" stop-opacity=".8" />
      </linearGradient>
      <linearGradient id="glassTint" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#52f6e0" stop-opacity=".045" />
        <stop offset=".5" stop-color="#936bff" stop-opacity=".09" />
        <stop offset="1" stop-color="#4adfff" stop-opacity=".045" />
      </linearGradient>
      <linearGradient id="sandFill" x1="0" y1="0" x2=".9" y2="1">
        <stop offset="0" stop-color="#fff2a6" />
        <stop offset=".42" stop-color="#ffc857" />
        <stop offset="1" stop-color="#ff7b42" />
      </linearGradient>
      <linearGradient id="sandStream" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#fff4b0" stop-opacity=".2" />
        <stop offset=".45" stop-color="#ffd166" />
        <stop offset="1" stop-color="#ff8f52" stop-opacity=".12" />
      </linearGradient>
      <linearGradient id="sandCore" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#fff7c2" stop-opacity="0" />
        <stop offset=".2" stop-color="#fff2ad" />
        <stop offset=".72" stop-color="#ffc857" />
        <stop offset="1" stop-color="#ff9d55" stop-opacity="0" />
      </linearGradient>
      <radialGradient id="hourglassAura">
        <stop stop-color="#8b5cf6" stop-opacity=".2" />
        <stop offset="1" stop-color="#0a1521" stop-opacity="0" />
      </radialGradient>
      <filter id="glassGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="sandGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <clipPath id="upperChamber">
        <path d="M210 20 C255 40 315 68 358 92 L224 197 Q210 208 196 197 L62 92 C105 68 165 40 210 20Z" />
      </clipPath>
      <clipPath id="lowerChamber">
        <path d="M196 223 Q210 212 224 223 L358 329 C315 354 255 384 210 402 C165 384 105 354 62 329Z" />
      </clipPath>
    </defs>

    <ellipse class="hourglass-aura" cx="210" cy="210" rx="195" ry="202" fill="url(#hourglassAura)" />

    <g class="hourglass-stars" fill="#75fff0">
      <circle cx="55" cy="140" r="2" />
      <circle cx="365" cy="166" r="1.8" />
      <circle cx="75" cy="282" r="1.5" />
      <circle cx="344" cy="274" r="2" />
      <circle cx="110" cy="54" r="1.6" />
      <circle cx="315" cy="365" r="1.5" />
    </g>

    <g clip-path="url(#upperChamber)">
      <path class="hourglass-top-sand" fill="url(#sandFill)" d="M54 18H366V104C318 132 259 166 225 201Q210 220 195 201C161 166 102 132 54 104Z" />
      <g class="hourglass-top-details">
        <path class="hourglass-sand-glint" d="M80 92C129 119 172 149 201 196" />
        <g class="hourglass-sand-grains" fill="#fff4b0">
          <circle cx="123" cy="112" r="1.8" /><circle cx="155" cy="133" r="1.4" />
          <circle cx="179" cy="161" r="1.7" /><circle cx="282" cy="116" r="1.5" />
          <circle cx="251" cy="143" r="1.8" /><circle cx="230" cy="173" r="1.3" />
        </g>
      </g>
    </g>

    <g clip-path="url(#lowerChamber)">
      <path class="hourglass-bottom-sand" fill="url(#sandFill)" d="M210 256C238 286 294 318 350 329C312 355 259 385 210 402C161 385 108 355 70 329C126 318 182 286 210 256Z" />
    </g>
    <g class="hourglass-bottom-details" clip-path="url(#lowerChamber)">
      <path class="hourglass-bottom-glint" d="M106 344C151 365 183 381 210 391C238 381 272 364 315 344" />
      <g class="hourglass-sand-grains" fill="#fff4b0">
        <circle cx="142" cy="358" r="1.7" /><circle cx="177" cy="378" r="1.3" />
        <circle cx="267" cy="359" r="1.7" /><circle cx="237" cy="380" r="1.4" />
      </g>
    </g>

    <g class="hourglass-sand-flow">
      <path class="hourglass-stream-aura" d="M210 207C208 260 212 330 210 402" />
      <path class="hourglass-falling-stream" d="M210 207C208 260 212 330 210 402" />
      <path class="hourglass-stream-core" d="M210 210C209 262 211 328 210 398" />
      <g class="hourglass-falling-grains" fill="#ffe98a" filter="url(#sandGlow)">
        <circle cx="210" cy="214" r="2.5" />
        <circle cx="206" cy="216" r="1.5" />
        <circle cx="214" cy="213" r="2" />
        <circle cx="204" cy="217" r="1.3" />
        <circle cx="215" cy="215" r="1.8" />
        <circle cx="207" cy="212" r="1.4" />
        <circle cx="212" cy="218" r="2.2" />
        <circle cx="209" cy="215" r="1.3" />
        <circle cx="205" cy="213" r="1.2" />
        <circle cx="216" cy="218" r="1.5" />
        <circle cx="211" cy="211" r="1.1" />
        <circle cx="203" cy="215" r="1.1" />
        <circle cx="217" cy="214" r="1.2" />
      </g>
    </g>
    <g class="hourglass-neck-sparks" fill="#fff2ad">
      <circle cx="198" cy="211" r="1.6" /><circle cx="222" cy="211" r="1.6" />
      <circle cx="202" cy="219" r="1.1" /><circle cx="218" cy="219" r="1.1" />
    </g>

    <path class="hourglass-glass-tint" d="M210 20 C255 40 315 68 358 92 L224 197 Q210 208 196 197 L62 92 C105 68 165 40 210 20Z M196 197 Q210 208 224 197 L224 223 Q210 212 196 223Z M196 223 Q210 212 224 223 L358 329 C315 354 255 384 210 402 C165 384 105 354 62 329Z" />
    <g class="hourglass-glass" fill="none" stroke="url(#glassEdge)" stroke-linejoin="round">
      <path class="hourglass-upper-outline" stroke-width="3" d="M210 20 C255 40 315 68 358 92 L224 197 Q210 208 196 197 L62 92 C105 68 165 40 210 20Z" />
      <path class="hourglass-neck-band" stroke-width="2.4" d="M196 197 Q210 208 224 197 L224 223 Q210 212 196 223Z" />
      <path class="hourglass-lower-outline" stroke-width="3" d="M196 223 Q210 212 224 223 L358 329 C315 354 255 384 210 402 C165 384 105 354 62 329Z" />
      <path class="hourglass-rim-highlight" stroke-width="1.3" d="M77 89C122 64 174 35 210 23M343 329C298 355 250 384 210 398" />
    </g>
    <ellipse class="hourglass-neck-ring" cx="210" cy="210" rx="19" ry="7" />

    <circle class="hourglass-neck-flash" cx="210" cy="210" r="7" />
  </svg>
</template>
