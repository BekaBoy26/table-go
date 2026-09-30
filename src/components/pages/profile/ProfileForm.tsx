"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/restaurants";
import { User, useStore } from "@/lib/store";

// The email is the account's login, so it can't be changed here.
const fields = [
  { name: "name", label: "Name", type: "text", placeholder: "Your name", editable: true },
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com", editable: false },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+996 700 000 000", editable: true },
] as const;

type Profile = { name: string; phone: string | null };

/** Name and phone; guests see them on their bookings. */
const ProfileForm = () => {
  const { user, updateUser } = useStore();
  const [editing, setEditing] = useState(false);
  const save = useMutation({
    mutationFn: async (profile: Profile) => (await api.patch<User & { phone: string | null }>("/auth/me", profile)).data,
    onSuccess: (me) => {
      updateUser({ ...user, name: me.name, phone: me.phone ?? "" });
      setEditing(false);
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    save.mutate({
      name: String(form.get("name")).trim(),
      phone: String(form.get("phone") ?? "").trim() || null,
    });
  };

  const onCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.form?.reset();
    save.reset();
    setEditing(false);
  };

  return (
    <form key={JSON.stringify(user)} onSubmit={onSubmit} className="surface space-y-6 p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {fields.map((f) => (
          <label key={f.name}>
            <span className="caption mb-1.5 block">{f.label}</span>
            <Input
              name={f.name}
              type={f.type}
              placeholder={f.placeholder}
              defaultValue={user[f.name]}
              readOnly={!editing || !f.editable}
              title={f.editable ? undefined : "The email is your login and can't be changed"}
              required={f.name === "name"}
              className="h-10 rounded-xl read-only:cursor-default read-only:bg-muted read-only:text-muted-foreground read-only:focus-visible:ring-0"
            />
          </label>
        ))}
      </div>

      {save.error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMessage(save.error)}</p>
      )}

      {/* separate keys so clicking Edit can't submit the form */}
      <div className="flex justify-center gap-3">
        {editing ? (
          <>
            <Button key="cancel" type="button" variant="outline" className="h-10 w-32 rounded-xl" onClick={onCancel}>
              Cancel
            </Button>
            <Button key="save" type="submit" disabled={save.isPending} className="h-10 w-32 rounded-xl">
              {save.isPending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </>
        ) : (
          <Button key="edit" type="button" variant="outline" className="h-10 w-32 rounded-xl" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
    </form>
  );
};

export default ProfileForm;
