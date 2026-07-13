import { QRCode } from "../models/QRCode.model"; // adjust path if your models live elsewhere

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Owner-scoped fuzzy search across name / shortCode / destination.
 * Returns just enough fields for a search-result dropdown that navigates
 * to /dashboard/codes/:id on selection.
 */
export async function searchQRCodes(ownerId: string, query: string, limit = 8) {
  const q = query.trim();
  if (!q) return [];

  const regex = new RegExp(escapeRegex(q), "i");

  const results = await QRCode.find({
    owner: ownerId,
    $or: [{ name: regex }, { shortCode: regex }, { destination: regex }],
  })
    .select("_id name type status shortCode isDynamic scansTotal clicksTotal updatedAt")
    .sort({ updatedAt: -1 })
    .limit(limit);

  return results;
}