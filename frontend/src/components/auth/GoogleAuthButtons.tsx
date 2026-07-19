"use client";

import { GoogleLogin, useGoogleOneTapLogin, CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { googleLogin } from "@/store/slices/authSlice";

export function GoogleAuthButtons({
  oneTap = true,
  mode = "signin",
}: {
  oneTap?: boolean;
  mode?: "signin" | "signup";
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const redirectTo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect") ?? "/dashboard"
      : "/dashboard";

  const handleCredential = async (response: CredentialResponse) => {
    if (!response.credential) return; // silent — no credential means nothing to do yet

    const resultAction = await dispatch(googleLogin(response.credential));

    if (googleLogin.fulfilled.match(resultAction)) {
      router.push(redirectTo);
    }
  };

  // No-op on error: this fires routinely (no Google session, dismissed prompt, etc.)
  // and is not a real failure worth surfacing to the user. Real failures are
  // still toasted inside the googleLogin thunk when the backend rejects the credential.
  useGoogleOneTapLogin({
    onSuccess: handleCredential,
    onError: () => {},
    disabled: !oneTap,
  });

  return (
  <div className="mt-4 w-full">
  <div className="w-full flex justify-center">
    <GoogleLogin
      onSuccess={handleCredential}
      onError={() => {}}
      useOneTap={oneTap}
      theme="outline"
      size="large"
      shape="pill"
      width={420} // match your form width
      text={mode === "signup" ? "signup_with" : "signin_with"}
    />
  </div>
</div>
  );
}