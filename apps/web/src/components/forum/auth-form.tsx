"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [sent, setSent] = useState(false);
  const register = mode === "register";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="auth-command">root@fasthunter:~$ auth --mode={mode}</p>
      {register ? <label><span>Username</span><input required placeholder="hunter_handle" /></label> : null}
      <label><span>{register ? "Email" : "Email or username"}</span><input required placeholder={register ? "you@example.com" : "hunter_handle"} /></label>
      <label><span>Password</span><input required type="password" placeholder="••••••••" /></label>
      {register ? <label><span>Confirm password</span><input required type="password" placeholder="••••••••" /></label> : null}
      {!register ? <label className="check-row"><input type="checkbox" /><span>remember session</span></label> : null}
      <button className="form-submit" type="submit">{register ? "Register" : "Login"}</button>
      {sent ? <p className="form-success">:: frontend placeholder ready. Authentication backend is intentionally offline.</p> : null}
      <p className="auth-switch">
        {register ? "Already registered?" : "New to the forum?"}{" "}
        <Link href={register ? "/forum/login" : "/forum/register"}>{register ? "Login" : "Create account"}</Link>
      </p>
    </form>
  );
}
