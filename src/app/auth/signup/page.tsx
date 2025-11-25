// src/app/auth/signup/page.tsx
import { redirect } from 'next/navigation';

export default function AuthSignUpRedirect() {
  redirect('/signup');
}