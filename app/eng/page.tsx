import { getGalleries } from "@/lib/storage";
import HomeClient from "@/components/HomeClient";

export default async function EnglishHome() {
    const galleriesRaw = await getGalleries();
    const galleries = galleriesRaw.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return <HomeClient initialGalleries={galleries} lang="en" />;
}
