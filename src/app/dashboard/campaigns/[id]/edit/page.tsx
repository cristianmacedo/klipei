"use client";

import { use } from "react";
import { CampaignForm } from "@/components/dashboard/campaign-form";

export default function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CampaignForm mode="edit" campaignId={id} />;
}
