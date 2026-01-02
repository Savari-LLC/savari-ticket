"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const membership = useQuery(api.operators.getMyMembership);
  const createOperator = useMutation(api.operators.create);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to sign-in if not authenticated (only after loading completes)
  useEffect(() => {
    // Wait for both session loading to complete AND membership query to settle
    // membership === undefined means still loading, null means no membership
    if (!sessionLoading && !session && membership === null) {
      router.push("/sign-in");
    }
  }, [session, sessionLoading, membership, router]);

  // If already a member, redirect to dashboard
  useEffect(() => {
    if (membership) {
      router.push("/dashboard");
    }
  }, [membership, router]);

  // Show loading while session is loading or membership query hasn't settled
  if (sessionLoading || membership === undefined) {
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

  if (membership) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createOperator({ name, slug: slug.toLowerCase() });
      router.push("/operator");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create operator");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Operator</CardTitle>
          <CardDescription>
            Set up your transport operator to start managing routes and passengers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Operator Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Acme Transport"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(generateSlug(e.target.value));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                type="text"
                placeholder="acme-transport"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be used in invite links
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Operator"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
