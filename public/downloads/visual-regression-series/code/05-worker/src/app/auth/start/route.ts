import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const supabase = await serverClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: new URL("/auth/callback", request.url).href },
  });
  if (error || !data.url)
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  return NextResponse.redirect(data.url);
}
