import type { Metadata } from "next";
import { headers } from "next/headers";
import DeadlineRadarRoot from "@/components/deadline-radar-root";

const title = "DeadlineRadar — Plan smarter, finish calmer";
const description = "Spot workload collisions and build a realistic study plan.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: image, width: 1792, height: 933, alt: "DeadlineRadar — Plan smarter. Finish calmer." }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function Home() {
  return <DeadlineRadarRoot />;
}
