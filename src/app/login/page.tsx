import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>📊 Muze Ops Portal</h1>
        <p>
          เข้าสู่ระบบด้วยบัญชี Google ขององค์กร
          <br />
          (muze.co.th)
        </p>
        {error && (
          <p className="error">
            บัญชีนี้ไม่ได้รับอนุญาตให้เข้าใช้งาน (ต้องเป็นอีเมล @muze.co.th)
          </p>
        )}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button type="submit" className="signin-btn">
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
