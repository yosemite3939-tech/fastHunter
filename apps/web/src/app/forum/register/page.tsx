import { AuthForm } from "@/components/forum/auth-form";
import { PageHero } from "@/components/ui";

export const metadata = { title: "Forum Register" };

export default function RegisterPage() {
  return (
    <>
      <PageHero eyebrow="Forum access" title="Register." description="Create a community handle. Authentication is a frontend-ready placeholder for now." />
      <section className="auth-wrap wrap"><AuthForm mode="register" /></section>
    </>
  );
}
