import { SupportForm } from "@/components/support/support-form";
import { PageHero, SectionLabel } from "@/components/ui";

export const metadata = { title: "Support & Reports" };

export default function SupportPage() {
  return (
    <>
      <PageHero eyebrow="Support channel" title="Report bugs before they become legends." description="Send a clear report, request a feature, or ask for help. The form is prepared for backend wiring and handles files locally for now." />
      <section className="content-section wrap">
        <div className="section-heading"><SectionLabel index="01">Transmission form</SectionLabel><div><h2>Give the useful details.</h2><p>Specific steps and a screenshot make the next build better. No account required.</p></div></div>
        <SupportForm />
      </section>
    </>
  );
}
