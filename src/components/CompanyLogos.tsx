import React from 'react';
import { CliProviderId } from '../utils/cliEngine';

interface BrandLogoProps {
  provider: CliProviderId;
  className?: string;
}

/**
 * Renders the respective company vector SVG emblem for each CLI engine:
 * - 1.1 Grok CLI (xAI geometric slash-X emblem in Neon Pink/Red)
 * - 1.2 Gemini CLI (Google Gemini 4-point spark emblem in Neon Blue/Gold)
 * - 1.3 Codex CLI (OpenAI hexagonal knot emblem in Neon Gold/Blue)
 * - 1.4 GitHub CLI (GitHub Octocat silhouette emblem in Neon Pink)
 */
export const CompanyLogoSvg: React.FC<BrandLogoProps> = ({
  provider,
  className = 'w-5 h-5',
}) => {
  if (provider === 'grok') {
    return (
      <svg
        data-company-logo="grok"
        viewBox="0 0 24 24"
        fill="none"
        aria-label="xAI Grok Logo"
        className={className}
      >
        <path
          d="M4 4L13.5 19.5H19.5L10 4H4Z"
          stroke="#E11D74"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.5 4L13.2 11.8M4.5 19.5L10.5 12.2"
          stroke="#DC2626"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (provider === 'gemini') {
    return (
      <svg
        data-company-logo="gemini"
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Google Gemini Logo"
        className={className}
      >
        <path
          d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
          stroke="#0284C7"
          strokeWidth="1.9"
          fill="rgba(2, 132, 199, 0.16)"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.2" fill="#D97706" />
      </svg>
    );
  }

  if (provider === 'codex') {
    return (
      <svg
        data-company-logo="codex"
        viewBox="0 0 24 24"
        fill="none"
        aria-label="OpenAI Codex Logo"
        className={className}
      >
        <polygon
          points="12,2.5 20.5,7.2 20.5,16.8 12,21.5 3.5,16.8 3.5,7.2"
          stroke="#D97706"
          strokeWidth="1.9"
          fill="rgba(217, 119, 6, 0.14)"
        />
        <path
          d="M12 6.5L16.8 9.2V14.8L12 17.5L7.2 14.8V9.2L12 6.5Z"
          stroke="#0284C7"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" r="1.9" fill="#E11D74" />
      </svg>
    );
  }

  if (provider === 'gh') {
    return (
      <svg
        data-company-logo="gh"
        viewBox="0 0 24 24"
        fill="none"
        aria-label="GitHub CLI Logo"
        className={className}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          fill="#E11D74"
        />
      </svg>
    );
  }

  return (
    <svg
      data-company-logo="system"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="DevForge System Logo"
      className={className}
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke="#0284C7"
        strokeWidth="1.9"
      />
      <path
        d="M7 9L10.5 12L7 15M12.5 15H17"
        stroke="#D97706"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
