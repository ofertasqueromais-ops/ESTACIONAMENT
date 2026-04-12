import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, password, action, role } = await req.json();

    if (!email || !action) {
      throw new Error("Email and action are required");
    }

    let result;

    if (action === "create") {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) throw error;

      if (role) {
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: data.user.id, role }, { onConflict: "user_id,role" });
      }

      result = { status: "created", user: data.user };
    } else if (action === "update") {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users.users.find((u: any) => u.email === email);

      if (!user) throw new Error("User not found");

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: password,
      });

      if (error) throw error;

      result = { status: "updated", user: data.user };
    } else {
      throw new Error("Invalid action");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
