"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [accepting, setAccepting] = useState(false);

  const inviteData = useQuery(
    api.members.getInviteByToken,
    token ? { token } : "skip"
  );
  const acceptInvite = useMutation(api.members.acceptInvite);

  useEffect(() => {
    if (!sessionLoading && !session && token) {
      router.push(`/sign-up?invite=${token}`);
    }
  }, [session, sessionLoading, token, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Invalid Invite</CardTitle>
            <CardDescription>No invite token provided</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (sessionLoading || inviteData === undefined || accepting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Invalid Invite</CardTitle>
            <CardDescription>
              This invite is invalid, expired, or has already been used
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/sign-in")}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptInvite({ token });
      router.push(`/${inviteData.invite.role}`);
    } catch (err) {
      console.error("Failed to accept invite:", err);
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
          <CardDescription>
            Join {inviteData.operator?.name} as a {inviteData.invite.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Invited as</p>
            <p className="font-semibold capitalize">{inviteData.invite.role}</p>
          </div>
          <Button onClick={handleAccept} className="w-full">
            Accept Invitation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto mt-2" />
            </CardHeader>
          </Card>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
