import { getGalleries } from "@/lib/storage";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
    const galleriesRaw = await getGalleries();
    const galleries = galleriesRaw
        .filter(g => !g.hidden)
        .sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

    return <HomeClient initialGalleries={galleries} />;
}
