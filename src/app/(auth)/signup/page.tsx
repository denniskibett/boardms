import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | BoardMS",
  description: "Create your BoardMS account",
};

export default function SignUp() {
  return <SignUpForm />;
}