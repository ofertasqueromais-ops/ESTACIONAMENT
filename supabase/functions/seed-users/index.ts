import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "admin@pereira.com", password: "191919", role: "admin" },
    { email: "caixa@pereira.com", password: "191919", role: "staff" },
  ];

  const results = [];

  for (const u of users) {
    // Check if user already exists
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users?.find((x: any) => x.email === u.email);

    let userId: string;

    if (found) {
      userId = found.id;
      results.push({ email: u.email, status: "already exists", userId });
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });
      if (error) {
        results.push({ email: u.email, status: "error", error: error.message });
        continue;
      }
      userId = data.user.id;
      results.push({ email: u.email, status: "created", userId });
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: u.role }, { onConflict: "user_id,role" });

    if (roleError) {
      results.push({ email: u.email, roleStatus: "error", error: roleError.message });
    } else {
      results.push({ email: u.email, roleStatus: "assigned", role: u.role });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
