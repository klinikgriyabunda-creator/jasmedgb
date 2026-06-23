import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const upsertSchema = z.object({
  mode: z.enum(["create", "update"]),
  id: z.string().uuid().optional(),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  nama: z.string().min(1),
  role: z.enum(["owner", "bidan"]),
});

export const adminUpsertUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isOwner } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (!isOwner) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId = data.id;
    if (data.mode === "create") {
      if (!data.password) throw new Error("Password wajib untuk akun baru");
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { nama: data.nama },
      });
      if (error) throw new Error(error.message);
      userId = created.user.id;
      await supabaseAdmin.from("profiles").upsert({ id: userId!, nama: data.nama, email: data.email });
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId!);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId!, role: data.role });
    } else {
      if (!userId) throw new Error("ID wajib untuk update");
      const update: { email?: string; password?: string; user_metadata?: { nama: string } } = {
        email: data.email,
        user_metadata: { nama: data.nama },
      };
      if (data.password) update.password = data.password;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, update);
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("profiles").update({ nama: data.nama, email: data.email }).eq("id", userId);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    }
    return { id: userId };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isOwner } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (!isOwner) throw new Error("Forbidden");
    if (data.id === context.userId) throw new Error("Tidak bisa hapus akun sendiri");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
