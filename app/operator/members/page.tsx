"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MembersPage() {
  const membership = useQuery(api.operators.getMyMembership);
  const members = useQuery(
    api.members.list,
    membership?.operator?._id ? { operatorId: membership.operator._id } : "skip"
  );
  const invites = useQuery(
    api.members.listInvites,
    membership?.operator?._id ? { operatorId: membership.operator._id } : "skip"
  );

  const createInvite = useMutation(api.members.createInvite);
  const removeMember = useMutation(api.members.removeMember);
  const deleteInvite = useMutation(api.members.deleteInvite);

  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "driver" | "business">("driver");
  const [inviteLink, setInviteLink] = useState("");

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership?.operator?._id) return;

    const result = await createInvite({
      operatorId: membership.operator._id,
      email,
      role,
    });

    const link = `${window.location.origin}/sign-up?invite=${result.token}`;
    setInviteLink(link);
    setEmail("");
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  const handleRemoveMember = async (memberId: Id<"members">) => {
    if (confirm("Are you sure you want to remove this member?")) {
      await removeMember({ memberId });
      toast.success("Member removed");
    }
  };

  const handleDeleteInvite = async (inviteId: Id<"invites">) => {
    if (confirm("Are you sure you want to delete this invite?")) {
      await deleteInvite({ inviteId });
      toast.success("Invite deleted");
    }
  };

  const now = useMemo(() => Date.now(), []);
  const pendingInvites = useMemo(
    () => invites?.filter((i) => !i.usedAt && i.expiresAt > now) ?? [],
    [invites, now]
  );

  const roleColors: Record<string, "default" | "secondary" | "outline"> = {
    operator: "default",
    user: "default",
    driver: "secondary",
    business: "outline",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Members</h1>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setInviteLink("");
            setEmail("");
          }
        }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
            </DialogHeader>
            {inviteLink ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Share this link with the new member:
                </p>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly />
                  <Button variant="outline" onClick={copyInviteLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setInviteLink("")}
                >
                  Create Another Invite
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={role === "user" ? "default" : "outline"}
                      onClick={() => setRole("user")}
                      className="flex-1"
                    >
                      User
                    </Button>
                    <Button
                      type="button"
                      variant={role === "driver" ? "default" : "outline"}
                      onClick={() => setRole("driver")}
                      className="flex-1"
                    >
                      Driver
                    </Button>
                    <Button
                      type="button"
                      variant={role === "business" ? "default" : "outline"}
                      onClick={() => setRole("business")}
                      className="flex-1"
                    >
                      Business
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Send Invite
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleColors[member.role]}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {member.role !== "operator" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                    <TableRow key={invite._id}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleColors[invite.role]}>
                          {invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInvite(invite._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
