import { Logo } from '@/components/logo'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Align with Enjy',
  description: 'How Align with Enjy collects, uses, and protects your data.',
}

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `Align with Enjy is a ladies-only yoga, fitness & wellness studio located in 6th of October City, Giza, Egypt. This app is used to book classes, manage packages, and stay in touch with the studio. This policy explains what data the app collects and how it is used.`,
  },
  {
    title: '2. Information We Collect',
    body: `• Account details: your full name, phone number, and password (stored securely, never in plain text).
• Optional profile photo, if you choose to add one.
• Booking activity: the classes you book, attend, cancel, or join a waitlist for, and your class packages.
• Payment records: the amount, method (e.g. Instapay or cash), and status of payments for packages and classes. We do not collect or store card numbers inside the app.
• Approximate location: only at the moment you use the check-in feature, to confirm you are at the studio. Location is not tracked in the background.
• Push notification tokens, if you enable notifications, so we can send you class reminders and studio updates.`,
  },
  {
    title: '3. How We Use Your Information',
    body: `Your data is used only to operate the studio's services: managing your account and bookings, tracking your package balance, confirming attendance, sending class reminders and studio announcements, and keeping required business records of payments. We do not sell your data, use it for advertising, or share it with third parties for marketing.`,
  },
  {
    title: '4. Where Your Data Is Stored',
    body: `Data is stored securely with our infrastructure providers, Supabase (database & authentication) and Vercel (hosting). These providers process data on our behalf and do not use it for their own purposes.`,
  },
  {
    title: '5. How Long We Keep It',
    body: `Your account data is kept while your account is active. Payment records may be retained after account deletion where required for legitimate business and accounting purposes, in a form no longer linked to your identity.`,
  },
  {
    title: '6. Deleting Your Account',
    body: `You can permanently delete your account at any time from inside the app: Profile → Delete Account. This removes your personal details, bookings, packages, and notification tokens, and permanently disables your sign-in. This action cannot be undone.`,
  },
  {
    title: '7. Your Rights',
    body: `You may ask us to view, correct, or delete the personal data we hold about you at any time. Contact the studio directly and we will respond as soon as possible.`,
  },
  {
    title: '8. Children',
    body: `This app is intended for adults. We do not knowingly collect data from children under 13.`,
  },
  {
    title: '9. Contact Us',
    body: `For any privacy questions or requests, contact Align with Enjy via Instagram @yoga_together_forlife or through the studio in 6th of October City, Giza.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `If this policy changes, the updated version will be published on this page with a new effective date.`,
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="flex flex-col items-center mb-8">
          <Logo />
          <h1 className="text-2xl font-bold text-foreground mt-4">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground mt-1">Effective date: July 2, 2026</p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#006D77] mb-2">{s.title}</h2>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="text-center py-8">
          <Link href="/" className="text-sm font-semibold text-[#006D77] underline">
            Back to Align with Enjy
          </Link>
        </div>
      </div>
    </div>
  )
}
