import { AuthShell } from "./AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const notice = sp?.invited ? "invited" : typeof sp?.reason === "string" ? sp.reason : null;
  return (
    <AuthShell>
      <LoginForm notice={notice} />
    </AuthShell>
  );
}
