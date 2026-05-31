import { AuthForm } from "@/components/forum/auth-form";
import { PageHero } from "@/components/ui";

export const metadata = { title: "Forum Login" };

export default function LoginPage() {
  return (
    <>
      <PageHero eyebrow="Forum access" title="Login." description="Resume your community session. Authentication is a frontend-ready placeholder for now." />
      <section className="auth-wrap wrap"><AuthForm mode="login" /></section>
    </>
  );
}
