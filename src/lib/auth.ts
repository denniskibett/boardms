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
          console.log('🔐 Attempting Supabase auth for:', credentials.email);
          
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

          console.log('✅ Supabase auth successful for:', authData.user.email);

          // Get user profile from custom table
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authData.user.id)
            .single()

          // If profile doesn't exist, create it
          let profile = userProfile
          if (profileError || !userProfile) {
            console.log('🔄 Creating user profile in custom table...');
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
            console.log('🖼️ Using local image from database:', profile.image);
            userImage = profile.image;
          } else if (authData.user.user_metadata?.avatar_url) {
            console.log('🖼️ Using external avatar URL:', authData.user.user_metadata.avatar_url);
            userImage = authData.user.user_metadata.avatar_url;
          } else if (authData.user.user_metadata?.picture) {
            console.log('🖼️ Using external picture URL:', authData.user.user_metadata.picture);
            userImage = authData.user.user_metadata.picture;
          }

          const userData = {
            id: authData.user.id,
            email: authData.user.email,
            name: profile?.name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
            role: profile?.role || 'user',
            image: userImage, // This will prefer local images
          };

          console.log('✅ Returning user data:', userData);
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
      console.log('🔄 JWT callback - Token email:', token.email);
      console.log('🔄 JWT callback - User email:', user?.email);
      
      if (user) {
        token.role = user.role
        token.id = user.id
        // Preserve the image from user data
        if (user.image) {
          token.picture = user.image;
        }
        console.log('✅ JWT updated with user data');
      }
      
      // Update token if session is updated
      if (trigger === "update" && session) {
        token = { ...token, ...session }
        console.log('✅ JWT updated with session data');
      }
      
      return token
    },
    async session({ token, session }) {
      console.log('🔄 Session callback - Token email:', token.email);
      console.log('🔄 Session callback - Session user email:', session.user?.email);
      
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string // Use the image from token
        console.log('✅ Session populated with token data');
      }
      
      console.log('🎉 Final session object:', session);
      return session
    },

    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback - URL:', url);
      console.log('🔄 Redirect callback - Base URL:', baseUrl);
      
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
    signUp: '/auth/signup', 
    error: '/dashboard',
  },
  debug: process.env.NODE_ENV === 'development',
}