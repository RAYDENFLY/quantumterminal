import type { Metadata } from 'next';
import TopBarShell from '@/components/TopBarShell';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms of Service | Quantum Terminal / Ryn ID',
  description:
    'Terms of Service for Quantum Terminal / Ryn ID — an informational and educational crypto market analytics & community platform.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-terminal-accent">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-6 text-gray-200">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
  <TopBarShell initialModule="market" />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 text-terminal-text">
          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-6">
            <h1 className="text-2xl font-bold text-terminal-accent">Terms of Service</h1>
            <p className="mt-2 text-xs text-gray-400">Effective date: January 8, 2026</p>
            <p className="mt-4 text-sm leading-6 text-gray-200">
              These Terms of Service ("Terms") govern your access to and use of Quantum Terminal / Ryn ID
              ("Quantum Terminal", "we", "us", "our"), including the website, applications, and related services
              (collectively, the "Service").
            </p>

            <Section title="1) Acceptance of Terms">
              <p>
                By accessing or using the Service, you agree to these Terms and our Privacy Policy. If you don’t agree,
                do not use the Service.
              </p>
              <p>
                If you use the Service on behalf of an organization, you represent that you have authority to bind that
                organization to these Terms.
              </p>
            </Section>

            <Section title="2) Description of the Service">
              <p>
                Quantum Terminal is a crypto market analytics and community platform that provides market data views,
                charts, analytics, and community discussion features.
              </p>
              <p className="text-gray-300">
                The Service is not a cryptocurrency exchange, broker, wallet, custody provider, or payment processor.
              </p>
              <p>Some features may be beta/experimental and may change or be removed at any time.</p>
            </Section>

            <Section title="3) User Eligibility">
              <p>
                You must be able to form a legally binding contract where you live to use the Service. You’re
                responsible for ensuring your use complies with local laws and regulations.
              </p>
              <p>We may restrict access in any region or to any person if required to comply with law or mitigate risk.</p>
            </Section>

            <Section title="4) User Accounts & Responsibilities">
              <p>To access certain features, you may need to create an account.</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>Provide accurate information (e.g., email/username)</li>
                <li>Keep your credentials secure</li>
                <li>Promptly notify us of suspected unauthorized access</li>
                <li>
                  Be responsible for activity under your account (unless caused by our breach of reasonable security)
                </li>
              </ul>
              <p>
                We may impose rate limits, security checks, or other controls to protect the Service and users.
              </p>
            </Section>

            <Section title="5) Community Guidelines & Acceptable Use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>Post illegal content or content that infringes intellectual property rights</li>
                <li>Harass, threaten, defame, dox, or discriminate against others</li>
                <li>Share malware, attempt to hack, scrape excessively, or disrupt the Service</li>
                <li>Impersonate others or misrepresent affiliations</li>
                <li>Use the Service to promote scams, fraud, or deceptive schemes</li>
                <li>Post or solicit sensitive personal data (e.g., private keys, seed phrases)</li>
                <li>Use automated tools in a way that harms performance or violates rate limits</li>
              </ul>
              <p>We may remove content, restrict visibility, or suspend accounts for violations.</p>
            </Section>

            <Section title="6) User-Generated Content Disclaimer">
              <p>
                The Service includes user-generated content ("UGC"), including posts, comments, and submissions.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>UGC represents the views of the user, not Quantum Terminal.</li>
                <li>We do not endorse, guarantee, or verify UGC.</li>
                <li>You may be exposed to inaccurate, offensive, or harmful content.</li>
              </ul>
              <p>You are solely responsible for the content you submit and its consequences.</p>
            </Section>

            <Section title="7) No Financial Advice Disclaimer">
              <p>
                All content and features provided through the Service are for informational and educational purposes
                only.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-200">
                <li>Nothing on the Service is financial, investment, trading, legal, or tax advice.</li>
                <li>Any analysis, market updates, or community commentary are not guaranteed and may be wrong.</li>
                <li>You are solely responsible for your financial decisions and risk management.</li>
              </ul>
              <p className="text-gray-300">Never share your private keys/seed phrases. We will never ask for them.</p>
            </Section>

            <Section title="8) Limitation of Liability">
              <p>
                To the fullest extent permitted by law, the Service is provided “as is” and “as available”, without
                warranties of any kind.
              </p>
              <p>
                Quantum Terminal is not liable for losses arising from reliance on content (including UGC), market
                volatility, outages, delays, data inaccuracies, or unauthorized access (except to the extent caused by
                our failure to implement reasonable security measures).
              </p>
              <p>
                If liability cannot be excluded, our total liability will be limited to the maximum extent allowed by
                applicable law.
              </p>
            </Section>

            <Section title="9) Termination of Accounts">
              <p>You may stop using the Service at any time.</p>
              <p>
                We may suspend or terminate your access (including your account) if you violate these Terms, create
                risk or legal exposure, or if required to comply with law or protect the Service.
              </p>
            </Section>

            <Section title="10) Modifications to the Service & Terms">
              <p>We may update the Service or these Terms from time to time.</p>
              <p>
                If changes are material, we’ll make reasonable efforts to provide notice. Continued use after an
                effective date means you accept the updated Terms.
              </p>
            </Section>

            <Section title="11) Governing Law">
              <p>
                These Terms are governed by the laws of a jurisdiction determined by the Service operator, without
                regard to conflict-of-law rules.
              </p>
              <p>Where required, disputes will be handled in a competent court with jurisdiction.</p>
            </Section>

            <Section title="Contact">
              <p>
                For questions about these Terms, contact: <span className="text-gray-300">[add your official support email]</span>
              </p>
            </Section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
