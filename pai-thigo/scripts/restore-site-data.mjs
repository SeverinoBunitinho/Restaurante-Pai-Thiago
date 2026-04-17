import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");

function loadLocalEnv() {
  if (!existsSync(envPath)) {
    return;
  }

  const envContent = readFileSync(envPath, "utf8");

  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    [
      "Faltam variaveis para restaurar dados.",
      "Adicione em .env.local:",
      "NEXT_PUBLIC_SUPABASE_URL=...",
      "SUPABASE_SERVICE_ROLE_KEY=...",
    ].join("\n"),
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const menuCategories = [
  {
    name: "Da Brasa",
    slug: "da-brasa",
    description: "Cortes selecionados, fogo controlado e finalizacao elegante.",
    highlight_color: "gold",
    sort_order: 1,
  },
  {
    name: "Mar e Frescor",
    slug: "mar-e-frescor",
    description: "Peixes e frutos do mar com sotaque brasileiro contemporaneo.",
    highlight_color: "sage",
    sort_order: 2,
  },
  {
    name: "Acompanhamentos",
    slug: "acompanhamentos",
    description: "Complementos para compartilhar e construir a mesa.",
    highlight_color: "clay",
    sort_order: 3,
  },
  {
    name: "Porcoes",
    slug: "porcoes",
    description: "Entradas e porcoes para abrir a experiencia da casa.",
    highlight_color: "cream",
    sort_order: 4,
  },
  {
    name: "Sobremesas de Casa",
    slug: "sobremesas",
    description: "Finalizacoes classicas com assinatura do Pai Thiago.",
    highlight_color: "gold",
    sort_order: 5,
  },
  {
    name: "Bebidas",
    slug: "bebidas",
    description: "Nao alcoolicos, sucos da casa e refrigerantes gelados.",
    highlight_color: "sage",
    sort_order: 6,
  },
];

const juiceFlavorPreset = [
  "Laranja",
  "Limao",
  "Abacaxi",
  "Maracuja",
  "Acerola",
  "Goiaba",
  "Manga",
  "Melancia",
  "Melao",
  "Caju",
  "Uva",
  "Graviola",
  "Mangaba",
  "Seriguela",
  "Cupuacu",
  "Abacaxi com hortela",
  "Abacaxi com gengibre",
  "Abacaxi com limao",
  "Laranja com acerola",
  "Laranja com cenoura",
  "Laranja com lima",
  "Laranja com morango",
  "Maracuja com manga",
  "Manga com limao",
  "Acerola com laranja",
  "Detox (couve e limao)",
  "Acai com banana",
  "Vitamina de banana",
  "Vitamina de mamao",
  "Goiaba com leite",
];

const sodaFlavorPreset = [
  "Cola",
  "Cola Zero",
  "Guarana",
  "Guarana Zero",
  "Laranja",
  "Uva",
  "Limao",
  "Tonica",
];

const menuItems = [
  {
    categorySlug: "da-brasa",
    name: "Bife ancho Pai Thiago",
    description:
      "Ancho grelhado na brasa, demi-glace de rapadura e batatas crocantes com alecrim.",
    price: 92,
    prep_time: "18 min",
    spice_level: "suave",
    tags: ["carne", "brasa", "chef"],
    allergens: ["lacteos"],
    is_signature: true,
    sort_order: 1,
    stock_quantity: 18,
    low_stock_threshold: 5,
    portion_prices: {},
  },
  {
    categorySlug: "da-brasa",
    name: "Costela laqueada",
    description:
      "Costela bovina assada por longas horas, finalizada com glaze de melaco e farofa amanteigada.",
    price: 86,
    prep_time: "22 min",
    spice_level: "suave",
    tags: ["slow cooked", "brasileiro"],
    allergens: ["gluten", "lacteos"],
    is_signature: false,
    sort_order: 2,
    stock_quantity: 14,
    low_stock_threshold: 4,
    portion_prices: {},
  },
  {
    categorySlug: "da-brasa",
    name: "Picanha na moda Pai Thiago",
    description:
      "Picanha fatiada, manteiga de alho assado, arroz biro-biro e vinagrete da casa.",
    price: 99,
    prep_time: "20 min",
    spice_level: "suave",
    tags: ["picanha", "brasa", "classico"],
    allergens: ["lacteos"],
    is_signature: true,
    sort_order: 3,
    stock_quantity: 16,
    low_stock_threshold: 5,
    portion_prices: {},
  },
  {
    categorySlug: "da-brasa",
    name: "Fraldinha defumada",
    description:
      "Fraldinha com finalizacao defumada, pure de mandioquinha e molho de cebola tostada.",
    price: 79,
    prep_time: "19 min",
    spice_level: "suave",
    tags: ["defumado", "carne"],
    allergens: ["lacteos"],
    is_signature: false,
    sort_order: 4,
    stock_quantity: 12,
    low_stock_threshold: 4,
    portion_prices: {},
  },
  {
    categorySlug: "mar-e-frescor",
    name: "Polvo na manteiga de garrafa",
    description:
      "Polvo grelhado com arroz de coco tostado, vinagrete morno de tomate e coentro.",
    price: 98,
    prep_time: "20 min",
    spice_level: "medio",
    tags: ["frutos do mar", "assinatura"],
    allergens: ["crustaceos"],
    is_signature: true,
    sort_order: 1,
    stock_quantity: 10,
    low_stock_threshold: 3,
    portion_prices: {},
  },
  {
    categorySlug: "mar-e-frescor",
    name: "Camaroes ao molho de moqueca leve",
    description:
      "Camaroes salteados com molho cremoso de coco, pimentoes assados e arroz de castanhas.",
    price: 82,
    prep_time: "17 min",
    spice_level: "medio",
    tags: ["mar", "cremoso"],
    allergens: ["crustaceos", "oleaginosas"],
    is_signature: false,
    sort_order: 2,
    stock_quantity: 11,
    low_stock_threshold: 3,
    portion_prices: {},
  },
  {
    categorySlug: "mar-e-frescor",
    name: "Salmao grelhado ao limao siciliano",
    description:
      "File alto de salmao, legumes tostados e molho amanteigado de limao siciliano.",
    price: 88,
    prep_time: "18 min",
    spice_level: "suave",
    tags: ["peixe", "saudavel"],
    allergens: ["peixe", "lacteos"],
    is_signature: false,
    sort_order: 3,
    stock_quantity: 10,
    low_stock_threshold: 3,
    portion_prices: {},
  },
  {
    categorySlug: "acompanhamentos",
    name: "Arroz cremoso de queijo coalho",
    description: "Arroz caldoso, queijo coalho tostado e crocante de castanha.",
    price: 34,
    prep_time: "10 min",
    spice_level: "suave",
    tags: ["cremoso", "compartilhar"],
    allergens: ["lacteos", "oleaginosas"],
    is_signature: false,
    sort_order: 1,
    stock_quantity: 18,
    low_stock_threshold: 5,
    portion_prices: {},
  },
  {
    categorySlug: "acompanhamentos",
    name: "Pure de mandioquinha trufado",
    description: "Pure aveludado de mandioquinha com manteiga trufada.",
    price: 28,
    prep_time: "8 min",
    spice_level: "suave",
    tags: ["pure", "cremoso"],
    allergens: ["lacteos"],
    is_signature: false,
    sort_order: 2,
    stock_quantity: 20,
    low_stock_threshold: 5,
    portion_prices: {},
  },
  {
    categorySlug: "acompanhamentos",
    name: "Legumes na brasa",
    description: "Mix de legumes grelhados na brasa com azeite de ervas.",
    price: 24,
    prep_time: "9 min",
    spice_level: "suave",
    tags: ["vegetais", "leve"],
    allergens: [],
    is_signature: false,
    sort_order: 3,
    stock_quantity: 16,
    low_stock_threshold: 4,
    portion_prices: {},
  },
  {
    categorySlug: "porcoes",
    name: "Batata rustica trufada",
    description:
      "Batatas crocantes, toque trufado e maionese verde da casa.",
    price: 32,
    prep_time: "12 min",
    spice_level: "suave",
    tags: ["porcao", "compartilhar"],
    allergens: ["ovos"],
    is_signature: false,
    sort_order: 1,
    stock_quantity: 20,
    low_stock_threshold: 6,
    portion_prices: {},
  },
  {
    categorySlug: "porcoes",
    name: "Dadinho de tapioca",
    description: "Cubos dourados com geleia de pimenta suave.",
    price: 36,
    prep_time: "10 min",
    spice_level: "medio",
    tags: ["entrada", "brasileiro"],
    allergens: ["lacteos"],
    is_signature: false,
    sort_order: 2,
    stock_quantity: 18,
    low_stock_threshold: 5,
    portion_prices: {},
  },
  {
    categorySlug: "porcoes",
    name: "Coxinha de costela",
    description:
      "Massa leve e recheio de costela desfiada com creme de queijo.",
    price: 39,
    prep_time: "14 min",
    spice_level: "suave",
    tags: ["salgado", "casa"],
    allergens: ["gluten", "lacteos"],
    is_signature: true,
    sort_order: 3,
    stock_quantity: 15,
    low_stock_threshold: 4,
    portion_prices: {},
  },
  {
    categorySlug: "sobremesas",
    name: "Pudim brulee de rapadura",
    description:
      "Pudim liso de baunilha com crosta fina caramelizada e flor de sal.",
    price: 28,
    prep_time: "6 min",
    spice_level: "sem picancia",
    tags: ["classico", "casa"],
    allergens: ["ovos", "lacteos"],
    is_signature: true,
    sort_order: 1,
    stock_quantity: 16,
    low_stock_threshold: 5,
    portion_prices: {},
  },
  {
    categorySlug: "sobremesas",
    name: "Mousse de morango com chocolate",
    description:
      "Mousse aerado de morango com ganache meio amarga e crocante de cacau.",
    price: 26,
    prep_time: "6 min",
    spice_level: "sem picancia",
    tags: ["sobremesa", "chocolate"],
    allergens: ["lacteos"],
    is_signature: false,
    sort_order: 2,
    stock_quantity: 14,
    low_stock_threshold: 4,
    portion_prices: {},
  },
  {
    categorySlug: "sobremesas",
    name: "Cocada quente com sorvete",
    description:
      "Cocada cremosa servida quente com sorvete de baunilha artesanal.",
    price: 29,
    prep_time: "7 min",
    spice_level: "sem picancia",
    tags: ["sobremesa", "casa"],
    allergens: ["lacteos"],
    is_signature: false,
    sort_order: 3,
    stock_quantity: 12,
    low_stock_threshold: 4,
    portion_prices: {},
  },
  {
    categorySlug: "bebidas",
    name: "Coca-Cola",
    description:
      "Refrigerante gelado da casa. Sabores: Tradicional, Zero.",
    price: 8,
    prep_time: "2 min",
    spice_level: "suave",
    tags: ["bebidas", "refrigerantes"],
    allergens: [],
    is_signature: false,
    sort_order: 1,
    stock_quantity: 40,
    low_stock_threshold: 8,
    portion_prices: { small: 5, medium: 8, large: 13 },
    flavor_options: ["Tradicional", "Zero"],
  },
  {
    categorySlug: "bebidas",
    name: "Guarana Antarctica",
    description:
      "Refrigerante nacional bem gelado para acompanhar pratos da brasa.",
    price: 7.9,
    prep_time: "2 min",
    spice_level: "suave",
    tags: ["bebidas", "refrigerantes"],
    allergens: [],
    is_signature: false,
    sort_order: 2,
    stock_quantity: 36,
    low_stock_threshold: 8,
    portion_prices: { small: 5, medium: 7.9, large: 13 },
    flavor_options: ["Tradicional", "Zero"],
  },
  {
    categorySlug: "bebidas",
    name: "Guarana Kuat",
    description: "Guarana Kuat tradicional, servido gelado.",
    price: 7.9,
    prep_time: "2 min",
    spice_level: "suave",
    tags: ["bebidas", "refrigerantes"],
    allergens: [],
    is_signature: false,
    sort_order: 3,
    stock_quantity: 32,
    low_stock_threshold: 7,
    portion_prices: { small: 5, medium: 7.9, large: 13 },
    flavor_options: ["Tradicional", "Zero"],
  },
  {
    categorySlug: "bebidas",
    name: "Fanta",
    description:
      "Para matar sua sede com refrescancia. Sabores: Uva, Laranja, Guarana.",
    price: 8.5,
    prep_time: "2 min",
    spice_level: "suave",
    tags: ["bebidas", "refrigerantes"],
    allergens: [],
    is_signature: false,
    sort_order: 4,
    stock_quantity: 30,
    low_stock_threshold: 7,
    portion_prices: { small: 5.5, medium: 8.5, large: 13.5 },
    flavor_options: ["Laranja", "Uva", "Guarana"],
  },
  {
    categorySlug: "bebidas",
    name: "Sucos Pai Thiago",
    description:
      "Sucos naturais preparados na hora. Sabores: Laranja, Limao, Abacaxi, Maracuja, Acerola, Goiaba, Manga, Melancia, Caju, Graviola, Cupuacu, Morango com laranja, Detox.",
    price: 11.5,
    prep_time: "4 min",
    spice_level: "suave",
    tags: ["bebidas", "sucos"],
    allergens: [],
    is_signature: true,
    sort_order: 5,
    stock_quantity: 28,
    low_stock_threshold: 6,
    portion_prices: { small: 7.5, medium: 11.5, large: 16.5 },
    flavor_options: juiceFlavorPreset,
  },
  {
    categorySlug: "bebidas",
    name: "Agua mineral",
    description: "Agua mineral da casa. Sabores: Sem gas, Com gas.",
    price: 6,
    prep_time: "1 min",
    spice_level: "suave",
    tags: ["bebidas", "agua"],
    allergens: [],
    is_signature: false,
    sort_order: 6,
    stock_quantity: 50,
    low_stock_threshold: 10,
    portion_prices: { small: 4.5, medium: 6, large: 9 },
    flavor_options: ["Sem gas", "Com gas"],
  },
];

const testimonials = [
  {
    customer_name: "Marina Duarte",
    customer_role: "Cliente frequente",
    quote: "Atendimento impecavel e cozinha consistente em todas as visitas.",
    rating: 5,
    approved: true,
    sort_order: 1,
  },
  {
    customer_name: "Carlos Nunes",
    customer_role: "Empresario",
    quote: "Usei para jantar com clientes e a experiencia foi elegante e sem atrasos.",
    rating: 5,
    approved: true,
    sort_order: 2,
  },
  {
    customer_name: "Ana Paula Rocha",
    customer_role: "Moradora da regiao",
    quote: "Reserva simples pelo site e atendimento muito organizado no salao.",
    rating: 4,
    approved: true,
    sort_order: 3,
  },
];

function asPortionPrices(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  const normalized = {};

  for (const [size, amount] of Object.entries(value)) {
    const parsed = Number(amount);

    if (Number.isFinite(parsed) && parsed > 0) {
      normalized[size] = Number(parsed.toFixed(2));
    }
  }

  return normalized;
}

function canTryCompatibilityFallback(error) {
  const message = String(error?.message ?? "").toLowerCase();

  return (
    message.includes("image_url") ||
    message.includes("stock_quantity") ||
    message.includes("low_stock_threshold") ||
    message.includes("portion_prices") ||
    message.includes("flavor_options") ||
    error?.code === "PGRST204"
  );
}

async function upsertCategories() {
  const { error } = await supabase
    .from("menu_categories")
    .upsert(menuCategories, { onConflict: "slug" });

  if (error) {
    throw new Error(`Falha ao restaurar categorias: ${error.message}`);
  }
}

async function getCategoryMap() {
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, slug");

  if (error) {
    throw new Error(`Falha ao consultar categorias: ${error.message}`);
  }

  return new Map((data ?? []).map((category) => [category.slug, category.id]));
}

function buildCompatibilityPayloads(payload) {
  const withoutImage = { ...payload };
  delete withoutImage.image_url;

  const withoutStock = { ...payload };
  delete withoutStock.stock_quantity;
  delete withoutStock.low_stock_threshold;
  delete withoutStock.portion_prices;
  delete withoutStock.flavor_options;

  const withoutImageAndStock = { ...withoutStock };
  delete withoutImageAndStock.image_url;

  return [payload, withoutImage, withoutStock, withoutImageAndStock];
}

async function upsertMenuItems() {
  const categoryMap = await getCategoryMap();
  let restoredCount = 0;

  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.categorySlug);

    if (!categoryId) {
      console.warn(
        `[AVISO] Categoria ausente para ${item.name}: ${item.categorySlug}. Item ignorado.`,
      );
      continue;
    }

    const basePayload = {
      category_id: categoryId,
      name: item.name,
      description: item.description,
      image_url: item.image_url ?? null,
      price: Number(item.price),
      prep_time: item.prep_time ?? null,
      spice_level: item.spice_level ?? null,
      tags: Array.isArray(item.tags) ? item.tags : [],
      allergens: Array.isArray(item.allergens) ? item.allergens : [],
      flavor_options: Array.isArray(item.flavor_options)
        ? item.flavor_options
        : item.tags?.includes("sucos")
          ? juiceFlavorPreset
          : item.tags?.includes("refrigerantes")
            ? sodaFlavorPreset
            : [],
      is_signature: Boolean(item.is_signature),
      is_available: true,
      sort_order: Number(item.sort_order ?? 0),
      stock_quantity: Number(item.stock_quantity ?? 0),
      low_stock_threshold: Number(item.low_stock_threshold ?? 0),
      portion_prices: asPortionPrices(item.portion_prices),
    };

    const payloads = buildCompatibilityPayloads(basePayload);
    let saved = false;
    let lastError = null;

    for (const payload of payloads) {
      const result = await supabase
        .from("menu_items")
        .upsert(payload, { onConflict: "category_id,name" });

      if (!result.error) {
        saved = true;
        break;
      }

      lastError = result.error;

      if (!canTryCompatibilityFallback(result.error)) {
        break;
      }
    }

    if (!saved) {
      throw new Error(
        `Falha ao restaurar item "${item.name}": ${lastError?.message ?? "erro desconhecido"}`,
      );
    }

    restoredCount += 1;
  }

  return restoredCount;
}

async function upsertTestimonials() {
  const { data: tableCheck, error: tableCheckError } = await supabase
    .from("customer_testimonials")
    .select("id")
    .limit(1);

  if (tableCheckError) {
    console.warn(
      `[AVISO] Tabela customer_testimonials indisponivel. Depoimentos nao restaurados (${tableCheckError.message}).`,
    );
    return 0;
  }

  if (!Array.isArray(tableCheck)) {
    return 0;
  }

  let restoredCount = 0;

  for (const testimonial of testimonials) {
    const existingResult = await supabase
      .from("customer_testimonials")
      .select("id")
      .eq("customer_name", testimonial.customer_name)
      .limit(1)
      .maybeSingle();

    if (existingResult.error) {
      throw new Error(
        `Falha ao consultar depoimento "${testimonial.customer_name}": ${existingResult.error.message}`,
      );
    }

    if (existingResult.data?.id) {
      const updateResult = await supabase
        .from("customer_testimonials")
        .update({
          customer_role: testimonial.customer_role,
          quote: testimonial.quote,
          rating: testimonial.rating,
          approved: testimonial.approved,
          sort_order: testimonial.sort_order,
        })
        .eq("id", existingResult.data.id);

      if (updateResult.error) {
        throw new Error(
          `Falha ao atualizar depoimento "${testimonial.customer_name}": ${updateResult.error.message}`,
        );
      }
    } else {
      const insertResult = await supabase
        .from("customer_testimonials")
        .insert(testimonial);

      if (insertResult.error) {
        throw new Error(
          `Falha ao inserir depoimento "${testimonial.customer_name}": ${insertResult.error.message}`,
        );
      }
    }

    restoredCount += 1;
  }

  return restoredCount;
}

async function main() {
  console.log("Iniciando restauracao de dados do Pai Thiago...");

  await upsertCategories();
  console.log(`Categorias sincronizadas: ${menuCategories.length}`);

  const restoredItems = await upsertMenuItems();
  console.log(`Itens de cardapio sincronizados: ${restoredItems}`);

  const restoredTestimonials = await upsertTestimonials();
  console.log(`Depoimentos sincronizados: ${restoredTestimonials}`);

  console.log("Restauracao concluida com sucesso.");
}

main().catch((error) => {
  console.error(`Erro na restauracao: ${error.message || error}`);
  process.exit(1);
});
