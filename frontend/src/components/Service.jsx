import React, { useEffect, useState } from "react";
import {Link} from 'react-router-dom'
import { ChevronRight, MousePointer2Off } from "lucide-react";

const PlaceholderImg = "/placeholder-service.jpg";

const ServiceCard = ({ service }) => {
  const hasSrcSet =
    !!service.imageSrcSet ||
    (!!service.imageSmall && !!service.imageMedium && !!service.imageLarge);

  const src = service.imageUrl || service.image || service.imageSmall || "";
  const srcSet =
    service.imageSrcSet ||
    (service.imageSmall || service.image
      ? `${service.imageSmall || src} 480w, ${
          service.imageMedium || src
        } 768w, ${service.imageLarge || src} 1200w`
      : null);

  const name = service.name || "Service";
  const shortDescription = service.shortDescription || service.about || "";

  return (
    <div className="group rounded-2xl overflow-hidden bg-white shadow-xl hover:-translate-y-2 transition-transform duration-500 border border-emerald-100">
      <div
        className="w-full overflow-hidden bg-emerald-50/30 flex items-center justify-center"
        aria-hidden="true"
      >
        {hasSrcSet ? (
          <picture className="w-full">
            {service.imageWebp && (
              <source srcSet={service.imageWebp} type="image/webp" />
            )}
            {service.imageSrcSet ? (
              <img
                src={src || PlaceholderImg}
                srcSet={service.imageSrcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                alt={name}
                loading="lazy"
                decoding="async"
                className="w-full h-40 sm:h-48 md:h-56 lg:h-60 object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PlaceholderImg;
                }}
              />
            ) : (
              <img
                src={src || PlaceholderImg}
                srcSet={srcSet || undefined}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                alt={name}
                loading="lazy"
                decoding="async"
                className="w-full h-40 sm:h-48 md:h-56 lg:h-60 object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PlaceholderImg;
                }}
              />
            )}
          </picture>
        ) : (
          <img
            src={src || PlaceholderImg}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-60 sm:h-48 md:h-56 lg:h-60 object-cover object-center transform transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PlaceholderImg;
            }}
          />
        )}
      </div>

      <div className="p-5 text-center">
        <h3 className="text-lg md:text-sm whitespace-nowrap font-semibold font-serif text-emerald-900">
          {name}
        </h3>

        <div className="mt-4">
          {service.available ? (
            <Link
              to={`/services/${service.id}`}
              state={{ service: service.raw || service }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 w-full rounded-full bg-emerald-500 text-white font-medium"
              aria-label={`Book ${name}`}
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
              Book Now
            </Link>
          ) : (
            <button
              disabled
              className="px-5 py-2 w-full flex items-center justify-center gap-2 rounded-full bg-gray-200 text-gray-500 cursor-not-allowed border"
              aria-label={`${name} not available`}
            >
              <MousePointer2Off className="w-5 h-5" aria-hidden="true" />
              Not Available
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ServicePage = ({ previewCount = 9999 }) => {
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadServices() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/services`);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (json && json.message) || `Failed to load services (${res.status})`;
        setError(msg);
        setServices([]);
        setLoading(false);
        return;
      }

      const items = (json && (json.data || json)) || [];
      const normalized = (Array.isArray(items) ? items : []).map((s) => {
        const id = s._id || s.id;
        const image = s.imageUrl || s.image || s.imageSmall || "";
        const available =
          typeof s.available === "boolean"
            ? s.available
            : typeof s.availability === "string"
              ? s.availability.toLowerCase() === "available"
              : s.availability === "Available" || s.available === true;

        return {
          id,
          name: s.name || "Service",
          shortDescription: s.shortDescription || s.about || "",
          image,
          imageSmall: s.imageSmall || null,
          imageMedium: s.imageMedium || null,
          imageLarge: s.imageLarge || null,
          imageSrcSet: s.imageSrcSet || null,
          imageWebp: s.imageWebp || null,
          price: s.price ?? s.fee ?? 0,
          available,
          raw: s,
        };
      });

      setServices(normalized);
    } catch (err) {
      console.error("load services error:", err);
      setError("Network error while loading services.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, [API_BASE]);

  const shown = services.slice(0, previewCount);

  return (
    <div className="min-h-screen py-12 px-6 lg:px-20 font-serif bg-linear-to-b from-emerald-50 to-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-emerald-900">
            Our Diagnostic Service
          </h1>
          <p className="mt-2 text-emerald-800/80">
            Safe,accurate & reliable testing.
          </p>
        </header>
        {error && (
          <div className="text-center mb-6">
            <div className="text-sm text-rose-600 mb-2">{error}</div>
            <button
              onClick={loadServices}
              className="px-4 py-2 rounded-full bg-emerald-600 text-white"
            >
              Retry
            </button>
          </div>
        )}
        {loading ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse group rounded-2xl overflow-hidden bg-white shadow-xl p-4"
              >
                <div className="w-full h-48 bg-emerald-100 rounded mb-4"></div>
                <div className="h-5 bg-emerald-100 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-emerald-100 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-emerald-100 rounded w-full"></div>
              </div>
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8">
            {shown.length > 0 ? (
              shown.map((s) => <ServiceCard key={s.id || s.name} service={s} />)
            ) : (
              <div className="col-span-full text-center py-10 text-emerald-800 font-medium text-base">
                No Services Found
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ServicePage;
