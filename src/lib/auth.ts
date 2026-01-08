import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { Account } from "next-auth";
import Google from "next-auth/providers/google";
import { supabaseAdmin } from "./supabase";

type ExtendedToken = JWT & {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
};

type ExtendedSession = Session & {
  accessToken?: string;
  error?: string;
};

async function syncUserToSupabase(
  email: string,
  name: string | null | undefined,
  image: string | null | undefined,
  accessToken: string | undefined,
  refreshToken: string | undefined,
  tokenExpiresAt: number | undefined
) {
  if (!supabaseAdmin) {
    console.error("Supabase service role key not configured");
    return;
  }

  try {
    const expiresAtDate = tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : null;

    const { error } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          email,
          name: name || null,
          image: image || null,
          access_token: accessToken || null,
          refresh_token: refreshToken || null,
          token_expires_at: expiresAtDate,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
        }
      );

    if (error) {
      console.error("Error syncing user to Supabase:", error);
    } else {
      console.log("Successfully synced user to Supabase:", email);
    }
  } catch (error) {
    console.error("Failed to sync user to Supabase:", error);
  }
}

async function refreshAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken ?? "",
      }),
    });

    const tokens = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      error?: string;
    };

    if (!response.ok || !tokens.access_token) {
      throw new Error(tokens.error ?? "Failed to refresh access token");
    }

    const newToken = {
      ...token,
      accessToken: tokens.access_token,
      accessTokenExpires: Date.now() + (tokens.expires_in ?? 0) * 1000,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };

    // Sync refreshed token to Supabase
    if (token.email) {
      await syncUserToSupabase(
        token.email as string,
        token.name as string | null | undefined,
        token.picture as string | null | undefined,
        newToken.accessToken,
        newToken.refreshToken,
        newToken.accessTokenExpires
      );
    }

    return newToken;
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const authConfig: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
        
         
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }: { token: JWT; account: Account | null; user?: any }) {
      const extendedToken = token as ExtendedToken;

      if (account) {
        const newToken = {
          ...extendedToken,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? extendedToken.refreshToken,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : undefined,
        };

        // Sync user to Supabase on initial sign-in
        if (token.email) {
          await syncUserToSupabase(
            token.email,
            token.name,
            token.picture,
            newToken.accessToken,
            newToken.refreshToken,
            newToken.accessTokenExpires
          );
        }

        return newToken;
      }

      if (extendedToken.accessToken && extendedToken.accessTokenExpires && Date.now() < extendedToken.accessTokenExpires - 60_000) {
        return extendedToken;
      }

      if (extendedToken.refreshToken) {
        return refreshAccessToken(extendedToken);
      }

      return {
        ...extendedToken,
        error: "NoRefreshToken",
      };
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const extendedToken = token as ExtendedToken;
      const extendedSession: ExtendedSession = {
        ...session,
        accessToken: extendedToken.accessToken,
        error: extendedToken.error,
      };
      return extendedSession;
    },
  },
  pages: {
    signIn: "/signup",
  },
};

export { authConfig };
