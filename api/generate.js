import { handleCommunityGenerate } from './_lib/communityAddressApi.mjs';

export default async function handler(req, res) {
  return handleCommunityGenerate(req, res);
}