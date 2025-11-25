// src/app/auth/signin/page.tsx
import { redirect } from 'next/navigation';

export default function AuthSignInRedirect() {
  redirect('/signin');
}