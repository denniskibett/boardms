import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "boardms - Sign In",
  description: "This is the Sign In page for the BoardMS application.",
};

export default function SignIn() {
  return <SignInForm />;
}
