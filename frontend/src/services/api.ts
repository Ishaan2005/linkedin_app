const API_BASE = "http://127.0.0.1:8000/api";

export async function getLeads() {
  const response = await fetch(`${API_BASE}/leads`);

  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }

  const data = await response.json();

  return data.map((lead: any) => ({
    id: String(lead.id),

    name: lead.name,
    title: lead.title ?? "",
    company: lead.company ?? "",
    location: lead.location ?? "",

    linkedinUrl: lead.linkedin_url ?? "",
    email: "",

    relevanceScore: lead.relevance_score ?? 0,

    technicalAreas: [],
    roleCategory: "OTHER",

    scoreBreakdown: {
      roleScore: 0,
      technicalScore: 0,
      companyScore: 0,
      jobScore: 0,
      locationScore: 0,
    },

    recommendationReason: "",

    dataSource: "Backend",
    associatedJobId: undefined,

    status: lead.status ?? "NEW",

    isDailyLead: false,
    discoveredDate: lead.created_at ?? "",

    lastContactedDate: undefined,
    followUpDate: undefined,

    notes: lead.notes ?? "",

    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  }));
}


export async function updateLeadStatus(
  leadId: string,
  status: string
) {
  const response = await fetch(
    `${API_BASE}/leads/${leadId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update lead status");
  }

  return response.json();
}

