import { fetchSeoApi, generateHelperMetadata, generateNoIndexMetadata } from "../../lib/seo";
import { buildPersonSchema, buildBreadcrumbSchema } from "../../lib/schema";
import JsonLd from "../../components/seo/JsonLd";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const res = await fetchSeoApi(`/seo/public/helpers/${encodeURIComponent(id)}`);
  if (!res?.helper) {
    return generateNoIndexMetadata(
      "Helper Profile | HireBuddy",
      "Explore verified home service helpers on HireBuddy.",
      `/helpers/${id}`
    );
  }
  return generateHelperMetadata(res.helper, res.canonicalUrl, res.indexability);
}

export default async function HelperProfileLayout({ children, params }) {
  const { id } = await params;
  const res = await fetchSeoApi(`/seo/public/helpers/${encodeURIComponent(id)}`);
  const helper = res?.helper;

  const schemas = [];
  if (helper) {
    const personSchema = buildPersonSchema(helper, res.canonicalUrl);
    if (personSchema) schemas.push(personSchema);
    schemas.push(
      buildBreadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
        { label: helper.name, href: `/helpers/${helper.slug || id}` },
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
