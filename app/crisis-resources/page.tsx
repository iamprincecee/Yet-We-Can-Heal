export default function CrisisResourcesPage() {
  return (
    <section className="px-6 md:px-16 py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl mb-6">
        If you need help right now
      </h1>
      <p className="font-body text-ink/80 mb-8 leading-relaxed">
        This site offers stories and companionship, but it isn&apos;t a professional
        or emergency service. If you&apos;re in crisis or thinking about harming
        yourself, please reach out to a crisis service or emergency care in your
        area right away.
      </p>

      {/* Direct line for this project -- fill in real contact details once provided */}
      <div className="bg-blush/60 rounded-card p-6 mb-8">
        <p className="font-mono text-xs uppercase tracking-wide text-ink/60 mb-3">
          Talk to someone from Yet, We Can Heal
        </p>
        <p className="font-body text-ink/80 mb-4">
          If you just need to talk to someone right now and aren&apos;t sure where
          else to turn, you can reach our team directly. This isn&apos;t a
          professional crisis line, but a real person will respond.
        </p>
        <ul className="font-body text-ink/90 space-y-2">
          <li>
            <span className="font-medium">Email:</span>{" "}
            <a href="mailto:care@yetwecanheal.org" className="underline hover:text-ember">
              care@yetwecanheal.org
            </a>
          </li>
          <li>
            <span className="font-medium">WhatsApp / Phone:</span>{" "}
            <span className="text-ink/50">[add number here]</span>
          </li>
        </ul>
      </div>

      <div className="bg-ink/5 rounded-card p-6">
        <p className="font-body text-ink/70 text-sm">
          For immediate, professional support, consider contacting a local crisis
          line, emergency services, or a trusted person who can stay with you.
          Searching &quot;crisis helpline&quot; along with your country will
          surface options available where you are.
        </p>
      </div>
    </section>
  );
}
