import { fetchSeoApi, generateHelperMetadata, generateNoIndexMetadata } from "../../lib/seo";
import { buildPersonSchema, buildBreadcrumbSchema } from "../../lib/schema";
import JsonLd from "../../components/seo/JsonLd";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const res = await fetchSeoApi(`/api/seo/public/helpers/${encodeURIComponent(id)}`);
  if (!res?.helper) {
    return generateNoIndexMetadata(
      "Helper Profile",
      "Explore verified home service helpers on HireBuddy."
    );
  }
  return generateHelperMetadata(res.helper);
}

export default async function HelperProfileLayout({ children, params }) {
  const { id } = await params;
  const res = await fetchSeoApi(`/api/seo/public/helpers/${encodeURIComponent(id)}`);
  const helper = res?.helper;

  const schemas = [];
  if (helper) {
    const personSchema = buildPersonSchema(helper);
    if (personSchema) schemas.push(personSchema);
    schemas.push(
      buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
        { name: helper.name, path: `/helpers/${helper.slug || id}` },
      ])
    );
  }

  return (
    <>
      {schemas.length > 0 && <JsonLd data={schemas} />}
      {children}
    </>
  );
}
