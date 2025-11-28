import { redirect } from "next/navigation";

export default function LoginPage() {
  // Redirect to Stack Auth sign-in page
  redirect("/handler/sign-in");
}
