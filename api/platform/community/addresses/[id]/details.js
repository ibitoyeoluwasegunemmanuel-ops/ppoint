import { handleCommunityDetailsUpdate } from '../../../../../_lib/communityAddressApi.mjs';

export default async function handler(req, res) {
  return handleCommunityDetailsUpdate(req, res, req.query?.id);
}