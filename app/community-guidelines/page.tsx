export default function CommunityGuidelinesPage() {
  return (
    <section className="px-6 md:px-16 py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl mb-6">Community Guidelines</h1>
      <p className="font-body text-ink/80 leading-relaxed mb-8">
        Yet, We Can Heal exists to help people feel less alone. Everything here — every
        story, every reaction, every submission — is held to the same standard: kindness
        and emotional safety, always.
      </p>

      <div className="space-y-6">
        <Guideline
          title="Every story is reviewed before it's published"
          body="Nothing goes live automatically. Our team reads every submission and checks that it's safe, anonymous, and consistent with what this space is for."
        />
        <Guideline
          title="Anonymity is protected, always"
          body="Stories are never published with anything that could identify the person who wrote them. If a detail risks that, we'll edit it out before publishing — with the story's meaning kept intact."
        />
        <Guideline
          title="Only supportive reactions are allowed"
          body="This isn't a space for debate, criticism, or judgment of anyone's experience. Reactions here are limited to encouragement, on purpose."
        />
        <Guideline
          title="This is peer support, not therapy"
          body="Stories and resources here are meant to help you feel understood — not to replace professional care. If you're in crisis, please see our Crisis Resources page."
        />
        <Guideline
          title="Trigger warnings matter"
          body="Stories that touch on difficult specifics are tagged with a warning before you open them, so you can choose when — or whether — you're ready to read them."
        />
      </div>
    </section>
  );
}

function Guideline({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-ink/10 rounded-card p-6">
      <h3 className="font-display text-lg mb-2">{title}</h3>
      <p className="font-body text-ink/70 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
