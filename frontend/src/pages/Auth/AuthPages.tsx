import { useAuthPolicy } from "../../auth/useAuthPolicy";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import { api } from "../../services/api";
import { authRequest, signIn } from "../../services/auth";
import { useAuthStore, homeFor, safeDestination } from "../../auth/state";
import { errorMessage } from "../../services/errors";

export function AuthLayout({
  title,
  subtitle,
  children,
}: React.PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <main className="min-h-screen bg-cream-100 grid lg:grid-cols-2">
      <aside className="hidden lg:flex bg-charcoal-900 text-cream-100 p-16 flex-col justify-between">
        <Link to="/" className="text-2xl font-serif tracking-widest">
          STYLESENSE
        </Link>
        <div className="space-y-6 max-w-lg">
          <span className="uppercase text-xs tracking-[.3em] text-emerald-300">
            A wardrobe that feels like you
          </span>
          <h1 className="font-serif text-6xl leading-tight">
            Discover your next everyday favourite.
          </h1>
          <p className="text-cream-300 leading-relaxed">
            A considered shopping experience, a personal collection, and one
            account that keeps it all together.
          </p>
        </div>
        <p className="text-xs text-cream-300 flex items-center gap-2">
          <ShieldCheck size={16} /> Private account access. Clearly simulated
          checkout.
        </p>
      </aside>
      <section className="px-5 py-10 sm:px-12 flex items-center justify-center">
        <div className="w-full max-w-md space-y-7">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-brand"
          >
            <ArrowLeft size={16} /> Back to StyleSense
          </Link>
          <header>
            <h2 className="text-3xl font-serif text-charcoal-900">{title}</h2>
            <p className="text-sm text-charcoal-500 mt-2">{subtitle}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
export const fieldClass =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand/30";
export const primaryClass =
  "w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50";
export function strength(password: string, complexity = true) {
  const categories = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) =>
    r.test(password),
  ).length;
  return {
    valid:
      password.length >= 12 &&
      password.length <= 128 &&
      (!complexity || categories >= 3),
    score: Math.min(
      4,
      Math.floor(password.length / 6) + Math.max(0, categories - 2),
    ),
  };
}
export function PasswordFields({
  password,
  setPassword,
  confirmation,
  setConfirmation,
  showStrength = false,
}: {
  password: string;
  setPassword: (s: string) => void;
  confirmation?: string;
  setConfirmation?: (s: string) => void;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const policy = useAuthPolicy();
  const quality = strength(password, policy.data?.password_complexity ?? true);
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="account-password" className="block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="account-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete={showStrength ? "new-password" : "current-password"}
            required
            minLength={showStrength ? 12 : 1}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass + " pr-12"}
          />
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-3 text-charcoal-500"
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {showStrength && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded ${quality.score >= i ? "bg-brand" : "bg-cream-300"}`}
                />
              ))}
            </div>
            <p role="status" className="text-xs text-charcoal-500">
              {quality.valid
                ? "Strong password"
                : "Use 12–128 characters and three of uppercase, lowercase, numbers and symbols."}
            </p>
          </div>
        )}
      </div>
      {setConfirmation && (
        <div className="space-y-2">
          <label
            htmlFor="account-confirmation"
            className="block text-sm font-medium"
          >
            Confirm password
          </label>
          <input
            id="account-confirmation"
            name="confirm_password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className={fieldClass}
            aria-invalid={!!confirmation && confirmation !== password}
          />
          {!!confirmation && confirmation !== password && (
            <p className="text-xs text-red-700">Passwords do not match.</p>
          )}
        </div>
      )}
    </>
  );
}
function EmailField({
  email,
  setEmail,
}: {
  email: string;
  setEmail: (s: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor="account-email" className="block text-sm font-medium">
        Email
      </label>
      <input
        id="account-email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={fieldClass}
      />
    </div>
  );
}
export function LoginPage() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  const from = safeDestination(location.state?.from);
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your personal StyleSense workspace."
    >
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const user = await signIn(email, password, remember);
            const destination =
              user.role === "customer" && !user.onboarding_completed
                ? "/onboarding"
                : from || homeFor(user);
            navigate(destination, { replace: true, state: { from } });
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {location.state?.message && (
          <p role="status" className="text-sm text-brand">
            {location.state.message}
          </p>
        )}
        {from && (
          <p className="text-sm text-charcoal-500">
            Sign in to continue to your saved destination.
          </p>
        )}
        <EmailField email={email} setEmail={setEmail} />
        <PasswordFields password={password} setPassword={setPassword} />
        <div className="flex justify-between gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            Remember this device
          </label>
          <Link to="/forgot-password" className="text-brand underline">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <button className={primaryClass} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-charcoal-600">
        New here?{" "}
        <Link to="/register" className="text-brand underline">
          Create an account
        </Link>
      </p>
      <p className="text-sm">
        <Link to="/verify-email" className="text-brand underline">
          Need to verify your email?
        </Link>
      </p>
    </AuthLayout>
  );
}
export function RegisterPage() {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  const policy = useAuthPolicy();
  return (
    <AuthLayout
      title="Make it your StyleSense"
      subtitle="Create a customer account to save your favourites and pick up where you left off."
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const { data } = await api.post(
              "/auth/register",
              {
                full_name: name,
                email,
                password,
                confirm_password: confirmation,
                terms_accepted: terms,
              },
              authRequest,
            );
            navigate("/verify-email", {
              state: { email: data.email, delivery: data.delivery_status },
            });
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {policy.data?.registration_enabled === false && (
          <p role="alert" className="text-sm text-red-800">
            Registration is temporarily unavailable.
          </p>
        )}
        <div>
          <label
            htmlFor="registration-name"
            className="block text-sm font-medium mb-2"
          >
            Full name
          </label>
          <input
            id="registration-name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>
        <EmailField email={email} setEmail={setEmail} />
        <PasswordFields
          password={password}
          setPassword={setPassword}
          confirmation={confirmation}
          setConfirmation={setConfirmation}
          showStrength
        />
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            required
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />{" "}
          <span>
            I accept the{" "}
            <Link to="/terms" target="_blank" className="text-brand underline">
              demonstration terms and privacy notice
            </Link>
            .
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          className={primaryClass}
          disabled={
            busy ||
            policy.data?.registration_enabled === false ||
            !terms ||
            !strength(password, policy.data?.password_complexity ?? true)
              .valid ||
            password !== confirmation
          }
        >
          {busy ? "Creating your account…" : "Create customer account"}
        </button>
      </form>
      <p className="text-sm">
        Already registered?{" "}
        <Link to="/login" className="text-brand underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
export function ForgotPasswordPage() {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We will provide instructions through the configured account email channel."
    >
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const { data } = await api.post(
              "/auth/forgot-password",
              { email },
              authRequest,
            );
            setMessage(
              data.message +
                (data.delivery_mode === "outbox"
                  ? " Development messages are available in the local email outbox; no real email is sent in this mode."
                  : ""),
            );
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <EmailField email={email} setEmail={setEmail} />
        {message && (
          <p role="status" className="text-sm text-brand">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <button className={primaryClass} disabled={busy}>
          {busy ? "Processing…" : "Request reset instructions"}
        </button>
      </form>
      <Link to="/login" className="text-sm text-brand underline">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
export function VerifyEmailPage() {
  const location = useLocation(),
    navigate = useNavigate();
  const token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
  const [email, setEmail] = useState(location.state?.email || ""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [verified, setVerified] = useState(false);
  return (
    <AuthLayout
      title={verified ? "Your email is verified" : "Verify your email"}
      subtitle="Open the single-use link from your account verification message."
    >
      {location.state?.delivery === "development_outbox" && (
        <p className="text-sm bg-emerald-50 p-4 rounded-xl">
          Development delivery is enabled. Your verification link is in the
          local email outbox described in the setup guide; no real email has
          been sent.
        </p>
      )}
      {location.state?.delivery === "unavailable" && (
        <p role="alert" className="text-sm text-red-800">
          The account was created, but verification delivery is unavailable. Ask
          the operator to configure delivery, then resend.
        </p>
      )}
      {token && !verified && (
        <button
          className={primaryClass}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const { data } = await api.post(
                "/auth/verify-email",
                { token },
                authRequest,
              );
              setMessage(data.message);
              setVerified(true);
              window.history.replaceState(null, "", "/verify-email");
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Verifying…" : "Verify email"}
        </button>
      )}
      {message && (
        <p role="status" className="text-sm text-brand">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      {verified ? (
        <button
          className={primaryClass}
          onClick={() =>
            navigate("/login", {
              state: {
                message: "Email verified. Sign in to finish your profile.",
              },
            })
          }
        >
          Continue to sign in
        </button>
      ) : (
        <form
          className="space-y-4 border-t border-cream-300 pt-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              const { data } = await api.post(
                "/auth/resend-verification",
                { email },
                authRequest,
              );
              setMessage(
                data.message +
                  (data.delivery_mode === "outbox"
                    ? " Check the local development outbox."
                    : ""),
              );
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <EmailField email={email} setEmail={setEmail} />
          <button className={primaryClass} disabled={busy}>
            Resend verification instructions
          </button>
        </form>
      )}
      <Link to="/login" className="text-sm text-brand underline">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
export function TokenPasswordPage({
  invitation = false,
}: {
  invitation?: boolean;
}) {
  const location = useLocation(),
    navigate = useNavigate();
  const token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
  const [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const policy = useAuthPolicy();
  return (
    <AuthLayout
      title={
        invitation ? "Join your StyleSense workspace" : "Choose a new password"
      }
      subtitle={
        invitation
          ? "Your administrator has already selected the permitted staff role."
          : "Reset links expire and can be used only once."
      }
    >
      {!token && (
        <p role="alert" className="text-sm text-red-800">
          This page needs a valid link from your email message.
        </p>
      )}
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api.post(
              invitation ? "/auth/accept-invitation" : "/auth/reset-password",
              {
                token,
                password,
                confirm_password: confirmation,
                ...(invitation ? { full_name: name } : {}),
              },
              authRequest,
            );
            useAuthStore.getState().clear();
            window.history.replaceState(null, "", location.pathname);
            navigate("/login", {
              replace: true,
              state: {
                message: invitation
                  ? "Staff account created. Sign in to your workspace."
                  : "Password reset. Sign in with your new password.",
              },
            });
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {invitation && (
          <div>
            <label htmlFor="invite-name" className="block text-sm mb-2">
              Full name
            </label>
            <input
              id="invite-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>
        )}
        <PasswordFields
          password={password}
          setPassword={setPassword}
          confirmation={confirmation}
          setConfirmation={setConfirmation}
          showStrength
        />
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          className={primaryClass}
          disabled={
            busy ||
            !token ||
            !strength(password, policy.data?.password_complexity ?? true)
              .valid ||
            confirmation !== password
          }
        >
          {busy
            ? "Saving…"
            : invitation
              ? "Activate staff account"
              : "Save new password"}
        </button>
      </form>
      <Link to="/login" className="text-sm text-brand underline">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
export function TermsPage() {
  return (
    <AuthLayout
      title="Demonstration terms and privacy"
      subtitle="StyleSense is a portfolio application with simulated commerce."
    >
      <div className="space-y-4 text-sm">
        <p>
          Use synthetic details when exploring the demonstration. No real
          payments, card numbers or delivery services are provided.
        </p>
        <p>
          Account, address, preference, cart and order records are stored in the
          operator-configured database. Passwords are hashed; refresh sessions
          use HttpOnly cookies. Development email may be written to a private
          local outbox rather than delivered.
        </p>
        <p>
          Do not enter confidential business information or payment-card data.
          Contact the application operator for questions about a deployed
          environment or removal of demonstration records.
        </p>
        <Link to="/register" className="text-brand underline">
          Return to registration
        </Link>
      </div>
    </AuthLayout>
  );
}
