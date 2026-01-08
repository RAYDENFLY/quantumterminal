import type { Metadata } from 'next';
import TopBarShell from '@/components/TopBarShell';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy | Quantum Terminal / Ryn ID',
  description:
    'Privacy Policy for Quantum Terminal / Ryn ID — how we collect, use, store, and protect your data on this market analytics & community platform.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-terminal-accent">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-6 text-gray-200">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
  <TopBarShell initialModule="market" />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 text-terminal-text">
          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-6">
            <h1 className="text-2xl font-bold text-terminal-accent">Privacy Policy</h1>
            <p className="mt-2 text-xs text-gray-400">Effective date: January 8, 2026</p>
            <p className="mt-4 text-sm leading-6 text-gray-200">
              This Privacy Policy explains how Quantum Terminal / Ryn ID ("Quantum Terminal", "we", "us", "our")
              collects, uses, and protects information when you use the Service.
            </p>

            <Section title="1) Information We Collect">
              <h3 className="text-sm font-semibold text-gray-100 mt-4">A. Account Data</h3>
              <p>When you register or use an account, we may collect:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>Email address</li>
                <li>Username</li>
                <li>Authentication/session identifiers</li>
                <li>Password (stored in hashed form; we do not store plaintext passwords)</li>
              </ul>

              <h3 className="text-sm font-semibold text-gray-100 mt-6">B. Community Content</h3>
              <p>When you post, comment, or submit content, we collect and store:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>Posts, comments, titles, text, and metadata you provide</li>
                <li>Associated identifiers (e.g., your username, timestamps)</li>
                <li>Moderation-related records (e.g., reports, admin actions) when applicable</li>
              </ul>

              <h3 className="text-sm font-semibold text-gray-100 mt-6">C. Basic Usage Data</h3>
              <p>We may collect basic technical/usage data such as:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>IP address (typically via server logs)</li>
                <li>Browser/device information (user agent)</li>
                <li>Pages or actions within the Service (e.g., requests, timestamps)</li>
                <li>Approximate location inferred from IP (coarse, not precise GPS)</li>
              </ul>
              <p className="text-gray-300">We aim to keep usage data minimal and used mainly for security, reliability, and analytics.</p>
            </Section>

            <Section title="2) How We Use Your Information">
              <p>We use information to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>Create and manage user accounts</li>
                <li>Authenticate users and maintain sessions</li>
                <li>Provide community features (posting, commenting, profiles)</li>
                <li>Moderate content and enforce our Terms</li>
                <li>Prevent abuse, spam, and security incidents</li>
                <li>Communicate about account actions (e.g., password reset, important notices)</li>
                <li>Maintain, troubleshoot, and improve the Service</li>
              </ul>
            </Section>

            <Section title="3) Data Storage & Security Practices">
              <p>We use reasonable technical and organizational measures to protect data.</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li><span className="text-gray-100">Database:</span> MongoDB</li>
                <li><span className="text-gray-100">Hosting/Compute:</span> Vercel</li>
              </ul>
              <p>
                Sensitive values (like passwords) are stored using secure hashing. Despite efforts, no system is 100%
                secure.
              </p>
            </Section>

            <Section title="4) Cookies & Sessions">
              <p>We use cookies and similar technologies primarily for authentication and session management.</p>
              <p>Disabling cookies may break login and other features.</p>
            </Section>

            <Section title="5) Third-Party Services">
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>
                  <span className="text-gray-100">CoinGecko (public data):</span> used to display public market data and
                  coin metadata.
                </li>
                <li>
                  <span className="text-gray-100">Email (Brevo SMTP):</span> used for transactional emails (e.g., password reset).
                </li>
                <li>
                  <span className="text-gray-100">Hosting (Vercel):</span> used to host the app and run server-side functions.
                </li>
              </ul>
              <p>
                Third parties may process limited data necessary to deliver their services. We may add or change
                vendors over time and will update this policy if changes are material.
              </p>
            </Section>

            <Section title="6) Data Sharing Policy (No Selling)">
              <p>We do not sell your personal data.</p>
              <p>We may share data only with:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>Service providers (e.g., hosting, email delivery) to operate the Service</li>
                <li>Authorities where required for legal compliance</li>
                <li>Security partners where necessary to prevent abuse or fraud</li>
                <li>Successors in a business transaction (e.g., merger/acquisition), subject to this policy</li>
              </ul>
            </Section>

            <Section title="7) Your Rights (Access, Update, Delete)">
              <p>
                Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data.
              </p>
              <p>
                You can request account deletion by contacting: <span className="text-gray-300">[add your official support email]</span>.
              </p>
              <p className="text-gray-300">
                Note: Some data may remain in backups for a limited time or be retained for legal/security reasons.
              </p>
            </Section>

            <Section title="8) Data Retention">
              <p>We retain data as long as necessary to provide the Service, ensure security, and comply with law.</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>Account data: retained while the account is active, and for a limited period after deletion request.</li>
                <li>Community content: may remain visible unless deleted/removed via moderation or deletion request.</li>
                <li>Logs/security events: retained for a limited period for reliability and abuse prevention.</li>
              </ul>
            </Section>

            <Section title="9) Policy Updates">
              <p>We may update this Privacy Policy from time to time.</p>
              <p>
                When we do, we’ll update the effective date and make reasonable efforts to notify you of material
                changes.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                For privacy questions or requests: <span className="text-gray-300">[add your official support email]</span>
              </p>
            </Section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
