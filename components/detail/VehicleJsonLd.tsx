import type { DetailVehicle } from "@/lib/home-data";
import { SITE_URL } from "@/lib/site";

const FUEL = { BEV: "Electric", PHEV: "Plug-in hybrid", EREV: "Extended-range electric" } as const;

/** schema.org Car + Offer, so search results can show the price and condition. */
export function VehicleJsonLd({ v }: { v: DetailVehicle }) {
  const [, make] = v.title.split(" ");
  const data = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: v.title,
    url: `${SITE_URL}/vehicles/${v.slug}`,
    brand: make ? { "@type": "Brand", name: make } : undefined,
    vehicleModelDate: String(v.modelYear),
    itemCondition: v.condition === "brand_new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileageKm, unitCode: "KMT" },
    fuelType: FUEL[v.powertrain],
    image: v.images.filter((i) => !i.isPdf).slice(0, 6).map((i) => i.url),
    description: v.description ?? undefined,
    offers: {
      "@type": "Offer",
      price: (v.priceKobo / 100).toFixed(0),
      priceCurrency: "NGN",
      availability: v.status === "sold" ? "https://schema.org/SoldOut"
        : v.status === "reserved" ? "https://schema.org/OutOfStock"
        : v.status === "available" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      areaServed: "Abuja, Nigeria",
      seller: { "@type": "AutoDealer", name: "Cars Direct" },
    },
  };
  // JSON.stringify output with "<" escaped so a title can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
