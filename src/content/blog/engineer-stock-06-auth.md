---
title: '[Guide] 工程師選股網 06：設定 Supabase 註冊、登入與寄信'
description: 核對環境變數、SMTP、Email 驗證與 PKCE callback，用收信及登入狀態驗收會員流程。
pubDate: 2026-11-02
updatedDate: 2026-11-27
category: "Full-stack"
series: engineer-stock
seriesOrder: 7
tags:
- Supabase
- Next.js
draft: false
relatedPostIds:
- engineer-stock-05-screener-charts
- engineer-stock-07-rls
references:
- title: Supabase PKCE 與授權碼交換
  url: https://supabase.com/docs/guides/auth/sessions/pkce-flow
- title: Supabase Email 驗證信模板
  url: https://supabase.com/docs/guides/auth/auth-email-templates
- title: Supabase SSR client
  url: https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs
- title: Supabase Custom SMTP
  url: https://supabase.com/docs/guides/auth/auth-smtp
- title: Google App Passwords
  url: https://support.google.com/accounts/answer/185833
- title: Gmail SMTP 設定
  url: https://support.google.com/mail/answer/7104828?hl=en
---

這次要在自己的 Next.js 專案新增會員頁。完成註冊、收信與 callback 後，重新整理仍可讀到同一個使用者，登出後回到表單。追蹤清單留給下一課。

這次練習把 SMTP 收信和登入分開驗證。下面的正式站截圖拍到表單；信件有沒有寄到、callback 是否換到 session，要用自己的測試信箱走完流程才能知道。

<figure>
  <a href="../../images/engineer-stock-series/06-auth-flow.svg"><img src="../../images/engineer-stock-series/06-auth-flow.svg" alt="Auth 流程示意：註冊經 SMTP 寄信；有效 code 在 callback 換成 Cookie session，無效或過期則回登入頁。" loading="lazy" decoding="async" /></a>
  <figcaption>Auth 流程示意：註冊經 SMTP 寄信；有效 code 在 callback 換成 Cookie session，無效或過期則回登入頁。</figcaption>
</figure>

## 1. 先對上環境

在 Supabase Dashboard 按 **New project**，選自己的 organization、填專案名與資料庫密碼、選擇 region。等新專案可以開啟後，從 **Connect** 找 Project URL、從 **Settings → API Keys** 找 publishable key。先寫下以下三項本機設定。

<figure><img src="../../downloads/visual-regression-series/images/official/supabase-create-project.webp" alt="Supabase 官方建立專案畫面，先選 organization，再填資料庫設定。" loading="lazy" decoding="async" /></figure>

| 名稱 | 填什麼 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | 這個會員專案的 API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 同一專案的 publishable key |

Project URL 和 publishable key 要來自同一個 Supabase 專案。`NEXT_PUBLIC_` 可被瀏覽器讀到，這裡只使用 publishable key；把資料庫密碼與 secret key 留在這個練習之外。

<figure>
  <img src="../../downloads/visual-regression-series/images/official/supabase-api-keys.webp" alt="Supabase 官方設定畫面，上半部的 Publishable key 可提供前端使用。" loading="lazy" decoding="async" />
</figure>

圖中只要看 **Publishable key**。下方 **Secret keys** 不需要複製。

需要在本機測試 Auth 時，使用獨立測試專案與本機 URL。第 1 篇的 fixture 設定只處理股票資料，不會建立登入 session。

## 2. 自己接一條 Email → Cookie 的路徑

使用第 1 篇的[選股網公開練習專案](../../downloads/stock-fixture-lab.zip)。解壓後在 `package.json` 旁建立 `.env.local`，填自己測試專案的 URL 和 publishable key。使用 Node.js 24。

```dotenv title=".env.local"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

這份範例已有 `src/lib/supabase/server.ts`。它的 `serverClient()` 將 Supabase SDK 接到 Next.js 的 Cookie store，所以 Server Action 可以把登入結果存回瀏覽器。先新增一個 Email 登入頁，讓首頁繼續展示公開行情，登入狀態由另一條路由處理。

```tsx title="src/app/email-lab/page.tsx"
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";

export default async function EmailLab({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  async function login(form: FormData) {
    "use server";
    const auth = await serverClient();
    const { error } = await auth.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    redirect(error ? "/email-lab?status=failed" : "/email-lab");
  }

  async function logout() {
    "use server";
    const auth = await serverClient();
    const { error } = await auth.auth.signOut({ scope: "local" });
    redirect(error ? "/email-lab?status=failed" : "/email-lab");
  }

  const auth = await serverClient();
  const { data: { user } } = await auth.auth.getUser();
  const { status } = await searchParams;
  return <main>
    <h1>會員連線練習</h1>
    {status === "failed" && <p role="alert">操作失敗，請檢查帳號與服務設定。</p>}
    {user ? <form action={logout}>
      <p>已登入：{user.email}</p><button>登出</button>
    </form> : <form action={login}>
      <label>Email <input name="email" type="email" required /></label>
      <label>密碼 <input name="password" type="password" required /></label>
      <button>登入</button>
    </form>}
  </main>;
}
```

1. 打開 `src/proxy.ts`，在原本 `matcher` 陣列加上 `"/email-lab/:path*"`，保留原有的 `/auth/:path*`。這樣這頁也會經過範例的 session 更新流程。
2. 在 Supabase 測試專案 **Authentication → Users → Add user → Create new user** 建立自己控制的測試帳號，勾選 **Auto Confirm User**。這一步讓你先驗證 Cookie，實際收信留到下段。
3. 在練習專案根目錄執行 `npm install`、`npm run dev`，開啟 `http://localhost:3000/email-lab`。先輸入錯誤密碼，看見錯誤訊息，再用正確密碼登入。
4. 重新整理時應該還看得到測試帳號的 Email。另開無痕視窗應顯示登入表單；回原視窗登出再重整，也應恢復表單。這兩次重整驗的是 Server 從 Cookie 重新取得的身分。

## 3. 設定驗證網址

到 Supabase **Authentication → URL Configuration**。本課先回到自己電腦上的登入頁，第 8 篇再新增 Production 網址。

| 欄位 | 本機測試值 |
| --- | --- |
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/email-lab/confirm` |

<figure>
  <img src="../../downloads/visual-regression-series/images/official/supabase-redirect-urls.webp" alt="官方設定範例，在 Redirect URLs 清單使用 Add URL 新增回到網站的網址。" loading="lazy" decoding="async" />
</figure>

圖中的 Flutter 網址是官方範例。你的 callback 要使用上表的 `/email-lab/confirm`，和接下來新增的 Route Handler 對齊。

到 **Authentication → Sign In / Providers → Email** 確認已啟用 Email，並啟用 **Confirm email**；回到 URL Configuration 檢查剛才新增的本機網址。

### 在練習站加入註冊與 callback

在 `EmailLab` 裡、`login` 旁新增這個 Server Action。用固定的站台網址產生 callback，部署到 Preview 時填自己的 Preview 網域。

```tsx title="src/app/email-lab/page.tsx"
async function register(form: FormData) {
  "use server";
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) throw new Error("請設定 NEXT_PUBLIC_SITE_URL");
  const auth = await serverClient();
  const { error } = await auth.auth.signUp({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
    options: { emailRedirectTo: new URL("/email-lab/confirm", site).href },
  });
  redirect(error ? "/email-lab?status=failed" : "/email-lab?status=mail");
}
```

在原本登入按鈕後面加上 `<button formAction={register}>建立帳號</button>`。在錯誤訊息下方加上 `{status === "mail" && <p>請查收驗證信，並在同一個瀏覽器開啟。</p>}`。

新增下列 Route Handler，到 **Redirect URLs** 加入 `http://localhost:3000/email-lab/confirm`。Email template 可使用 Supabase 預設的確認連結 `{{ .ConfirmationURL }}`；若你自行改為 token hash 模板，需採用相應的 `verifyOtp` 流程。

```ts title="src/app/email-lab/confirm/route.ts"
import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const auth = await serverClient();
  const result = code ? await auth.auth.exchangeCodeForSession(code) : null;
  const path = result && !result.error ? "/email-lab" : "/email-lab?status=failed";
  const response = NextResponse.redirect(new URL(path, url.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
```

先直接開 `/email-lab/confirm`。沒有 code 時應回到顯示錯誤的登入頁。接好下方的寄信設定後，用另一個尚未註冊的測試信箱按「建立帳號」，點信件裡的連結。回到頁面時應看見該帳號的 Email；重新整理後仍能看到，才表示 callback 和 Cookie 都接通。

## 4. 接上 SMTP

開 **Authentication → Emails → SMTP Settings**，啟用自訂 SMTP。以本專案先前選定的 Gmail SMTP 為例：

| 欄位 | 值 |
| --- | --- |
| Sender email | 自己用來寄信的 Gmail 地址 |
| Sender name | 工程師選股網 |
| Host | `smtp.gmail.com` |
| Port | `587`（TLS／STARTTLS） |
| Username | 完整 Gmail 地址 |
| Password | 專用 App Password，由自己在後台輸入 |

先開 Google 帳號的兩步驟驗證，按 [App Passwords 說明](https://support.google.com/accounts/answer/185833) 建立。組織帳號、Advanced Protection 或特定安全設定可能無此選項；需改用允許的 SMTP 服務。密碼只存 SMTP 設定，不放進 Repo 或文章截圖。

[Supabase 預設郵件服務有限制](https://supabase.com/docs/guides/auth/auth-smtp)，不能把表單存在視為公開註冊可用。Gmail 的寄信限制也需另外考量，這裡先完成一次實際收信驗收。

## 5. 跑一次完整回程

登出第 2 步的帳號，先以尚未註冊的測試信箱在 `/email-lab` 建立帳號。回到同一瀏覽器開啟驗證信，在 Network 查看 `/email-lab/confirm` 是否導回會員頁。畫面應顯示信箱；重整一次，再按登出，應恢復登入表單。圖中是正式產品的登入畫面，你自己寫的教學表單外觀會不同。

<figure><img src="../../images/engineer-stock-series/06-login.webp" alt="正式站的 Email 登入表單，用來對照教學版所需欄位。" loading="lazy" decoding="async" /></figure>

## 6. 按卡住的位置查

| 結果 | 先查 |
| --- | --- |
| 沒收到信 | SMTP 儲存狀態、寄件地址、Auth logs、收件匣與寄信限制 |
| callback 無效或過期 | Redirect allowlist、信件連結、同瀏覽器的 verifier 與連結時效 |
| 登入後重整失效 | Cookie adapter、`src/proxy.ts` 的 refresh、Server 的 `getUser` |
| Preview 可看股票但不能登入 | 該環境是否刻意未配置會員專案 |

完成後前往[追蹤清單與 RLS](../engineer-stock-07-rls/)，讓這個身分連到實際資料列。

[下載系列程式片段、圖片與驗證紀錄](../../downloads/engineer-stock-series.zip)
