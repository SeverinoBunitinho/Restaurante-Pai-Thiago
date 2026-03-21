import "server-only";

import { cache } from "react";

import { restaurantInfo as fallbackRestaurantInfo } from "@/lib/mock-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function normalizeList(items = [], fallback = []) {
  const resolvedItems = Array.isArray(items)
    ? items.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];

  return resolvedItems.length ? resolvedItems : fallback;
}

function digitsOnly(value = "") {
  return String(value ?? "").replace(/\D/g, "");
}

function withBrazilCode(phoneDigits) {
  if (!phoneDigits) {
    return "";
  }

  return phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;
}

function buildPhoneHref(phone, fallbackHref) {
  const digits = digitsOnly(phone);

  if (!digits) {
    return fallbackHref;
  }

  return `tel:+${withBrazilCode(digits)}`;
}

function buildWhatsappHref(phone, restaurantName, fallbackHref) {
  const digits = digitsOnly(phone);

  if (!digits) {
    return fallbackHref;
  }

  const message = encodeURIComponent(
    `Ola ${restaurantName}, quero falar sobre uma reserva.`,
  );

  return `https://wa.me/${withBrazilCode(digits)}?text=${message}`;
}

function buildEmailHref(email, fallbackHref) {
  const value = String(email ?? "").trim();

  if (!value) {
    return fallbackHref;
  }

  return `mailto:${value}`;
}

function mapDeliveryZone(zone) {
  return {
    id: zone.id,
    slug: zone.slug,
    name: zone.name,
    fee: Number(zone.fee ?? 0),
    etaMinutes: Number(zone.eta_minutes ?? 0),
    window: zone.service_window ?? "",
    active: zone.is_active ?? true,
    sortOrder: zone.sort_order ?? 0,
  };
}

function mergeRestaurantProfile(settings, deliveryZones) {
  const mergedProfile = {
    ...fallbackRestaurantInfo,
    name: settings?.restaurant_name || fallbackRestaurantInfo.name,
    tagline: settings?.tagline || fallbackRestaurantInfo.tagline,
    description: settings?.description || fallbackRestaurantInfo.description,
    address: settings?.address || fallbackRestaurantInfo.address,
    city: settings?.city || fallbackRestaurantInfo.city,
    phone: settings?.phone || fallbackRestaurantInfo.phone,
    whatsapp: settings?.whatsapp || fallbackRestaurantInfo.whatsapp,
    email: settings?.email || fallbackRestaurantInfo.email,
    mapUrl: settings?.map_url || fallbackRestaurantInfo.mapUrl,
    googleBusinessUrl:
      settings?.google_business_url || fallbackRestaurantInfo.googleBusinessUrl,
    instagramUrl: settings?.instagram_url || fallbackRestaurantInfo.instagramUrl,
    facebookUrl: settings?.facebook_url || fallbackRestaurantInfo.facebookUrl,
    instagramHandle:
      settings?.instagram_handle || fallbackRestaurantInfo.instagramHandle,
    facebookHandle:
      settings?.facebook_handle || fallbackRestaurantInfo.facebookHandle,
    schedule: normalizeList(
      settings?.schedule_lines,
      fallbackRestaurantInfo.schedule,
    ),
    holidayPolicy:
      settings?.holiday_policy || fallbackRestaurantInfo.holidayPolicy,
    serviceNotes: normalizeList(
      settings?.service_notes,
      fallbackRestaurantInfo.serviceNotes,
    ),
    about: {
      ...fallbackRestaurantInfo.about,
      story: settings?.about_story || fallbackRestaurantInfo.about.story,
      mission: settings?.about_mission || fallbackRestaurantInfo.about.mission,
    },
    delivery: {
      ...fallbackRestaurantInfo.delivery,
      minimumOrder: Number(
        settings?.delivery_minimum_order ??
          fallbackRestaurantInfo.delivery.minimumOrder,
      ),
      pickupEtaMinutes: Number(
        settings?.pickup_eta_minutes ??
          fallbackRestaurantInfo.delivery.pickupEtaMinutes,
      ),
      hotline:
        settings?.delivery_hotline || fallbackRestaurantInfo.delivery.hotline,
      coverageNote:
        settings?.delivery_coverage_note ||
        fallbackRestaurantInfo.delivery.coverageNote,
      neighborhoods:
        deliveryZones.length > 0
          ? deliveryZones
          : fallbackRestaurantInfo.delivery.neighborhoods,
    },
  };

  return {
    ...mergedProfile,
    phoneHref: buildPhoneHref(
      mergedProfile.phone,
      fallbackRestaurantInfo.phoneHref,
    ),
    whatsappHref: buildWhatsappHref(
      mergedProfile.whatsapp,
      mergedProfile.name,
      fallbackRestaurantInfo.whatsappHref,
    ),
    emailHref: buildEmailHref(
      mergedProfile.email,
      fallbackRestaurantInfo.emailHref,
    ),
  };
}

export const getRestaurantProfile = cache(async function getRestaurantProfile() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackRestaurantInfo;
  }

  const [settingsResult, deliveryZonesResult] = await Promise.all([
    supabase
      .from("restaurant_settings")
      .select(
        "id, restaurant_name, tagline, description, address, city, phone, whatsapp, email, map_url, google_business_url, instagram_url, facebook_url, instagram_handle, facebook_handle, schedule_lines, holiday_policy, service_notes, delivery_minimum_order, pickup_eta_minutes, delivery_hotline, delivery_coverage_note, about_story, about_mission",
      )
      .eq("id", "main")
      .maybeSingle(),
    supabase
      .from("delivery_zones")
      .select(
        "id, slug, name, fee, eta_minutes, service_window, is_active, sort_order",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (settingsResult.error) {
    return fallbackRestaurantInfo;
  }

  const mappedZones = (deliveryZonesResult.data ?? []).map(mapDeliveryZone);

  return mergeRestaurantProfile(settingsResult.data, mappedZones);
});

export const getRestaurantConfigurationBoard = cache(
  async function getRestaurantConfigurationBoard() {
  const supabase = await getSupabaseServerClient();
  const fallbackZones = fallbackRestaurantInfo.delivery.neighborhoods.map((zone, index) => ({
    id: zone.slug,
    slug: zone.slug,
    name: zone.name,
    fee: zone.fee,
    etaMinutes: zone.etaMinutes,
    window: zone.window,
    active: true,
    sortOrder: index + 1,
  }));
  const fallbackProfile = mergeRestaurantProfile(null, fallbackZones);

  if (!supabase) {
    return {
      settings: {
        name: fallbackProfile.name,
        tagline: fallbackProfile.tagline,
        description: fallbackProfile.description,
        address: fallbackProfile.address,
        city: fallbackProfile.city,
        phone: fallbackProfile.phone,
        whatsapp: fallbackProfile.whatsapp,
        email: fallbackProfile.email,
        mapUrl: fallbackProfile.mapUrl,
        googleBusinessUrl: fallbackProfile.googleBusinessUrl,
        instagramUrl: fallbackProfile.instagramUrl,
        facebookUrl: fallbackProfile.facebookUrl,
        instagramHandle: fallbackProfile.instagramHandle,
        facebookHandle: fallbackProfile.facebookHandle,
        scheduleText: fallbackProfile.schedule.join("\n"),
        holidayPolicy: fallbackProfile.holidayPolicy,
        serviceNotesText: fallbackProfile.serviceNotes.join("\n"),
        deliveryMinimumOrder: fallbackProfile.delivery.minimumOrder,
        pickupEtaMinutes: fallbackProfile.delivery.pickupEtaMinutes,
        deliveryHotline: fallbackProfile.delivery.hotline,
        deliveryCoverageNote: fallbackProfile.delivery.coverageNote,
        aboutStory: fallbackProfile.about.story,
        aboutMission: fallbackProfile.about.mission,
      },
      preview: fallbackProfile,
      deliveryZones: fallbackZones,
      usingSupabase: false,
    };
  }

  const [settingsResult, deliveryZonesResult] = await Promise.all([
    supabase
      .from("restaurant_settings")
      .select(
        "id, restaurant_name, tagline, description, address, city, phone, whatsapp, email, map_url, google_business_url, instagram_url, facebook_url, instagram_handle, facebook_handle, schedule_lines, holiday_policy, service_notes, delivery_minimum_order, pickup_eta_minutes, delivery_hotline, delivery_coverage_note, about_story, about_mission",
      )
      .eq("id", "main")
      .maybeSingle(),
    supabase
      .from("delivery_zones")
      .select(
        "id, slug, name, fee, eta_minutes, service_window, is_active, sort_order",
      )
      .order("sort_order", { ascending: true }),
  ]);

  if (settingsResult.error || deliveryZonesResult.error) {
    return {
      settings: {
        name: fallbackProfile.name,
        tagline: fallbackProfile.tagline,
        description: fallbackProfile.description,
        address: fallbackProfile.address,
        city: fallbackProfile.city,
        phone: fallbackProfile.phone,
        whatsapp: fallbackProfile.whatsapp,
        email: fallbackProfile.email,
        mapUrl: fallbackProfile.mapUrl,
        googleBusinessUrl: fallbackProfile.googleBusinessUrl,
        instagramUrl: fallbackProfile.instagramUrl,
        facebookUrl: fallbackProfile.facebookUrl,
        instagramHandle: fallbackProfile.instagramHandle,
        facebookHandle: fallbackProfile.facebookHandle,
        scheduleText: fallbackProfile.schedule.join("\n"),
        holidayPolicy: fallbackProfile.holidayPolicy,
        serviceNotesText: fallbackProfile.serviceNotes.join("\n"),
        deliveryMinimumOrder: fallbackProfile.delivery.minimumOrder,
        pickupEtaMinutes: fallbackProfile.delivery.pickupEtaMinutes,
        deliveryHotline: fallbackProfile.delivery.hotline,
        deliveryCoverageNote: fallbackProfile.delivery.coverageNote,
        aboutStory: fallbackProfile.about.story,
        aboutMission: fallbackProfile.about.mission,
      },
      preview: fallbackProfile,
      deliveryZones: fallbackZones,
      usingSupabase: false,
    };
  }

  const mappedZones = (deliveryZonesResult.data ?? []).map(mapDeliveryZone);
  const preview = mergeRestaurantProfile(
    settingsResult.data,
    mappedZones.filter((zone) => zone.active),
  );

  return {
    settings: {
      name: preview.name,
      tagline: preview.tagline,
      description: preview.description,
      address: preview.address,
      city: preview.city,
      phone: preview.phone,
      whatsapp: preview.whatsapp,
      email: preview.email,
      mapUrl: preview.mapUrl,
      googleBusinessUrl: preview.googleBusinessUrl,
      instagramUrl: preview.instagramUrl,
      facebookUrl: preview.facebookUrl,
      instagramHandle: preview.instagramHandle,
      facebookHandle: preview.facebookHandle,
      scheduleText: preview.schedule.join("\n"),
      holidayPolicy: preview.holidayPolicy,
      serviceNotesText: preview.serviceNotes.join("\n"),
      deliveryMinimumOrder: preview.delivery.minimumOrder,
      pickupEtaMinutes: preview.delivery.pickupEtaMinutes,
      deliveryHotline: preview.delivery.hotline,
      deliveryCoverageNote: preview.delivery.coverageNote,
      aboutStory: preview.about.story,
      aboutMission: preview.about.mission,
    },
    preview,
    deliveryZones: mappedZones,
    usingSupabase: true,
  };
});
