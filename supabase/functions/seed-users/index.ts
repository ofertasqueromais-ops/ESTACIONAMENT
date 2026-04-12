import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "mestre@pereira.com", password: "191919", role: "mestre" },
    { email: "admin@pereira.com", password: "191919", role: "admin" },
    { email: "caixa@pereira.com", password: "191919", role: "staff" },
  ];

  const results = [];

  for (const u of users) {
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

  // Create Pereira estacionamento if not exists
  const { data: existingEst } = await supabaseAdmin
    .from("estacionamentos")
    .select("id")
    .eq("email", "admin@pereira.com")
    .maybeSingle();

  if (!existingEst) {
    const { data: estData, error: estError } = await supabaseAdmin
      .from("estacionamentos")
      .insert({
        nome: "Pereira Estacionamento",
        responsavel: "Pereira",
        email: "admin@pereira.com",
        telefone: "(37) 99806-1725",
        status: "ativo",
      })
      .select("id")
      .single();

    if (estError) {
      results.push({ estacionamento: "error", error: estError.message });
    } else {
      results.push({ estacionamento: "created", id: estData.id });

      // Link existing veiculos/mensalistas/pagamentos to this estacionamento
      const adminUser = (await supabaseAdmin.auth.admin.listUsers()).data?.users?.find(
        (x: any) => x.email === "admin@pereira.com"
      );
      const caixaUser = (await supabaseAdmin.auth.admin.listUsers()).data?.users?.find(
        (x: any) => x.email === "caixa@pereira.com"
      );

      const userIds = [adminUser?.id, caixaUser?.id].filter(Boolean);
      
      for (const uid of userIds) {
        await supabaseAdmin.from("veiculos").update({ estacionamento_id: estData.id }).eq("user_id", uid!).is("estacionamento_id", null);
        await supabaseAdmin.from("mensalistas").update({ estacionamento_id: estData.id }).eq("user_id", uid!).is("estacionamento_id", null);
        await supabaseAdmin.from("pagamentos").update({ estacionamento_id: estData.id }).eq("user_id", uid!).is("estacionamento_id", null);
      }
    }
  } else {
    results.push({ estacionamento: "already exists", id: existingEst.id });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
