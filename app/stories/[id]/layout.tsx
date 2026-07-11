import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

// This server-side layout wraps the (client) story page purely to provide
// Open Graph / Twitter metadata, so shared links show a title, description,
// and image preview. It renders children unchanged — no effect on the page's
// own behaviour.
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("stories")
      .select("title, body, image_url")
      .eq("id", params.id)
      .eq("status", "approved")
      .single();

    if (!data) {
      return { title: "A story · Yet, We Can Heal" };
    }

    const title = data.title || "A healing story";
    const description =
      (data.body as string)?.slice(0, 155).trim() +
      ((data.body as string)?.length > 155 ? "…" : "");

    return {
      title: `${title} · Yet, We Can Heal`,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: data.image_url ? [{ url: data.image_url as string }] : undefined,
      },
      twitter: {
        card: data.image_url ? "summary_large_image" : "summary",
        title,
        description,
        images: data.image_url ? [data.image_url as string] : undefined,
      },
    };
  } catch {
    return { title: "A story · Yet, We Can Heal" };
  }
}

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
