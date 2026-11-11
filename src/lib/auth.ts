// src/lib/auth.ts - UPDATED WITH BETTER IMAGE HANDLING
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabase } from "./supabase/client"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ No credentials provided');
          return null
        }

        try {
          
          // Use Supabase Auth for authentication
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email.toLowerCase().trim(),
            password: credentials.password.trim(),
          })

          if (authError) {
            console.error('🔴 Supabase auth error:', authError);
            return null
          }

          if (!authData.user) {
            console.error('🔴 No user returned from Supabase');
            return null
          }


          // Get user profile from custom table
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authData.user.id)
            .single()

          // If profile doesn't exist, create it
          let profile = userProfile
          if (profileError || !userProfile) {
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  email: authData.user.email,
                  name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
                  role: 'user',
                  status: 'active',
                  auth_id: authData.user.id,
                  last_login: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ])
              .select()
              .single()

            if (insertError) {
              console.error('❌ Failed to create user profile:', insertError);
              // Continue anyway - we can still return the user
            } else {
              profile = newProfile
              console.log('✅ User profile created');
            }
          } else {
            // Only active accounts may sign in (suspended / inactive / pending are refused).
            const status = String(userProfile.status || 'active').toLowerCase();
            if (status !== 'active') {
              console.warn('Sign-in refused for non-active account');
              return null;
            }
            // Update last login
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('auth_id', authData.user.id)
          }

          // PREFER LOCAL IMAGES OVER EXTERNAL ONES
          let userImage = profile?.image;
          
          // If we have a local image in the database, use it instead of external
          if (profile?.image && !profile.image.startsWith('http')) {
            userImage = profile.image;
          } else if (authData.user.user_metadata?.avatar_url) {
            userImage = authData.user.user_metadata.avatar_url;
          } else if (authData.user.user_metadata?.picture) {
            userImage = authData.user.user_metadata.picture;
          }

          const userData = {
            id: authData.user.id,
            email: authData.user.email,
            name: profile?.name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
            role: profile?.role || 'user',
            image: userImage, // This will prefer local images
          };

          return userData;

        } catch (error) {
          console.error('💥 Auth error:', error);
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      
      if (user) {
        token.role = user.role
        token.id = user.id
        // Preserve the image from user data
        if (user.image) {
          token.picture = user.image;
        }
      }
      
      // Session updates from the browser may only change display fields.
      // Never copy role/id/email from the client — that would let a user grant themselves any role.
      if (trigger === "update" && session) {
        const s = (session as { user?: { name?: string; image?: string }; name?: string; image?: string });
        const name = s.user?.name ?? s.name;
        const image = s.user?.image ?? s.image;
        if (typeof name === 'string') token.name = name;
        if (typeof image === 'string') token.picture = image;
      }
      
      return token
    },
    async session({ token, session }) {
      
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string // Use the image from token
      }
      
      return session
    },

    async redirect({ url, baseUrl }) {
      
      // ✅ FIX: After successful authentication, redirect to home page
      if (url.includes('/api/auth/callback') || url.includes('/api/auth/session?')) {
        console.log('✅ Redirecting to home page after successful auth');
        return `${baseUrl}/`;  // Redirect to root instead of /dashboard
      }
      
      // ✅ FIX: If trying to access signin but already authenticated, go to home
      if (url.includes('/signin')) {
        console.log('✅ Redirecting from signin to home page');
        return `${baseUrl}/`;
      }
      
      // ✅ Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // ✅ Allow same origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin', 
    error: '/dashboard',
  },
  debug: process.env.NODE_ENV === 'development',
}