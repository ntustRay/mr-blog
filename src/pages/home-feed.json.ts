import { getHomeFeed } from '../utils/homeFeed';

export async function GET() {
  return Response.json(await getHomeFeed());
}
