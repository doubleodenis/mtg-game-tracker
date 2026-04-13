import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ProfileInsert = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if profile exists, create if not
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        let needsDisplayNameSetup = false;

        if (!existingProfile) {
          // Create new profile
          const username =
            user.user_metadata?.preferred_username ||
            user.user_metadata?.user_name ||
            user.email?.split("@")[0] ||
            `user_${user.id.slice(0, 8)}`;

          // Use the user's full name from OAuth or email signup as display name
          const displayName =
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            null;

          // If no display name from OAuth, user needs to set one
          needsDisplayNameSetup = !displayName;

          const newProfile: ProfileInsert = {
            id: user.id,
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
            display_name: displayName,
            avatar_url: user.user_metadata?.avatar_url || null,
          };

          await supabase.from("profiles").insert(newProfile as never);
        }

        // Build redirect URL
        let redirectUrl = next;
        if (needsDisplayNameSetup) {
          const separator = next.includes('?') ? '&' : '?';
          redirectUrl = `${next}${separator}setup=displayname`;
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectUrl}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`);
        } else {
          return NextResponse.redirect(`${origin}${redirectUrl}`);
        }
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
