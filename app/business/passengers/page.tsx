"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, QrCode, Archive, Pencil, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

const PAGE_SIZE = 10;

export default function PassengersPage() {
  const membership = useQuery(api.operators.getMyMembership);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  const passengersResult = useQuery(
    api.passengers.list,
    membership?.operator?._id
      ? {
          operatorId: membership.operator._id,
          paginationOpts: { cursor, numItems: PAGE_SIZE },
        }
      : "skip"
  );

  const createPassenger = useMutation(api.passengers.create);
  const updatePassenger = useMutation(api.passengers.update);
  const archivePassenger = useMutation(api.passengers.archive);
  const resendEmail = useMutation(api.passengers.resendTicketEmail);

  const [isOpen, setIsOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<NonNullable<typeof passengersResult>["page"][number] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const passengers = passengersResult?.page ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership?.operator?._id) return;

    try {
      if (editingPassenger) {
        await updatePassenger({
          passengerId: editingPassenger._id,
          name,
          email,
        });
        toast.success("Passenger updated");
      } else {
        await createPassenger({
          operatorId: membership.operator._id,
          name,
          email,
        });
        toast.success("Passenger added with QR code");
      }

      setIsOpen(false);
      setEditingPassenger(null);
      setName("");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save passenger");
    }
  };

  const handleEdit = (passenger: NonNullable<typeof passengersResult>["page"][number]) => {
    setEditingPassenger(passenger);
    setName(passenger.name);
    setEmail(passenger.email);
    setIsOpen(true);
  };

  const handleArchive = async (passengerId: Id<"passengers">) => {
    if (confirm("Are you sure you want to archive this passenger?")) {
      await archivePassenger({ passengerId });
      toast.success("Passenger archived");
    }
  };

  const handleResendEmail = async (passengerId: Id<"passengers">) => {
    await resendEmail({ passengerId });
    toast.success("Ticket email sent");
  };

  const handleNextPage = () => {
    if (passengersResult?.continueCursor) {
      setCursorStack((prev) => [...prev, cursor ?? ""]);
      setCursor(passengersResult.continueCursor);
    }
  };

  const handlePrevPage = () => {
    const newStack = [...cursorStack];
    const prevCursor = newStack.pop();
    setCursorStack(newStack);
    setCursor(prevCursor === "" ? null : prevCursor ?? null);
  };

  if (!passengersResult) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Passengers</h1>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Passengers</h1>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingPassenger(null);
            setName("");
            setEmail("");
          }
        }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Passenger
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPassenger ? "Edit Passenger" : "Add Passenger"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingPassenger ? "Update" : "Add"} Passenger
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Passengers</CardTitle>
        </CardHeader>
        <CardContent>
          {passengers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No passengers yet. Add your first passenger!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passengers.map((passenger) => (
                  <TableRow key={passenger._id}>
                    <TableCell className="font-medium">{passenger.name}</TableCell>
                    <TableCell>{passenger.email}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {passenger.qrCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      {new Date(passenger.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/business/qr/${passenger._id}`}>
                          <Button variant="ghost" size="icon" title="View QR Code">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResendEmail(passenger._id)}
                          title="Resend Ticket Email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(passenger)}
                          title="Edit Passenger"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchive(passenger._id)}
                          title="Archive Passenger"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {passengers.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={cursorStack.length === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!passengersResult?.continueCursor}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
