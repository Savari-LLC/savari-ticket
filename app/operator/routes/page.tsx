"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function RoutesPage() {
  const membership = useQuery(api.operators.getMyMembership);
  const routes = useQuery(
    api.routes.list,
    membership?.operator?._id ? { operatorId: membership.operator._id } : "skip"
  );

  const createRoute = useMutation(api.routes.create);
  const updateRoute = useMutation(api.routes.update);
  const deleteRoute = useMutation(api.routes.remove);

  const [isOpen, setIsOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<typeof routes extends (infer R)[] | undefined ? R | null : null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership?.operator?._id) return;

    if (editingRoute) {
      await updateRoute({
        routeId: editingRoute._id,
        name,
        description: description || undefined,
      });
    } else {
      await createRoute({
        operatorId: membership.operator._id,
        name,
        description: description || undefined,
      });
    }

    setIsOpen(false);
    setEditingRoute(null);
    setName("");
    setDescription("");
  };

  const handleEdit = (route: NonNullable<typeof routes>[number]) => {
    setEditingRoute(route);
    setName(route.name);
    setDescription(route.description || "");
    setIsOpen(true);
  };

  const handleDelete = async (routeId: Id<"routes">) => {
    if (confirm("Are you sure you want to delete this route?")) {
      await deleteRoute({ routeId });
    }
  };

  const handleToggleActive = async (route: NonNullable<typeof routes>[number]) => {
    await updateRoute({
      routeId: route._id,
      isActive: !route.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Routes</h1>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingRoute(null);
            setName("");
            setDescription("");
          }
        }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoute ? "Edit Route" : "Add Route"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Route Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Downtown Express"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Route description..."
                />
              </div>
              <Button type="submit" className="w-full">
                {editingRoute ? "Update" : "Create"} Route
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routes?.map((route) => (
          <Card key={route._id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{route.name}</CardTitle>
                <Badge 
                  variant={route.isActive ? "default" : "secondary"}
                  className="mt-1"
                >
                  {route.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(route)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(route._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {route.description && (
                <p className="text-sm text-muted-foreground mb-4">{route.description}</p>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleToggleActive(route)}
              >
                {route.isActive ? "Deactivate" : "Activate"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {routes?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No routes yet. Create your first route!</p>
        </div>
      )}
    </div>
  );
}
