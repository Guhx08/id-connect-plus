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
    const { formId, title, protocol, formData, corretorNome } = await req.json();

    if (!formId || !title || !protocol || !formData) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BITRIX_TOKEN = Deno.env.get("BITRIX_WEBHOOK_TOKEN");
    if (!BITRIX_TOKEN) {
      return new Response(JSON.stringify({ error: "Bitrix token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BITRIX_BASE = `https://rsimconsultoria.bitrix24.com.br/rest/9539/${BITRIX_TOKEN}`;

    // Determine sector config
    let categoryId = 215;
    let stageId = "C215:PREPARATION";
    let responsibleId = 92;
    if (formId.startsWith("mov-")) {
      categoryId = 211; stageId = "C211:UC_7FDY6D"; responsibleId = 9585;
    } else if (formId.startsWith("imp-")) {
      categoryId = 64; stageId = "C64:UC_J5HY3U"; responsibleId = 9703;
    }

    const dealTitle = title + (corretorNome ? " | " + corretorNome : "") + " — " + protocol;

    // 1) Create deal
    const dealResp = await fetch(`${BITRIX_BASE}/crm.deal.add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          TITLE: dealTitle,
          COMMENTS: formData,
          CATEGORY_ID: categoryId,
          STAGE_ID: stageId,
          ASSIGNED_BY_ID: responsibleId,
        },
      }),
    });
    const dealData = await dealResp.json();
    const dealId = dealData.result;

    // 2) Create linked task if deal was created
    if (dealId) {
      await fetch(`${BITRIX_BASE}/tasks.task.add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            TITLE: dealTitle,
            DESCRIPTION: formData,
            UF_CRM_TASK: ["D_" + dealId],
            RESPONSIBLE_ID: responsibleId,
          },
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, dealId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
