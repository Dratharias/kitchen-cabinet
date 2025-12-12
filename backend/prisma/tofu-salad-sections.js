import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  console.log('🥗 Creating Tofu Salad with sections...');

  // Create tags
  const healthy = await prisma.tag.upsert({
    where: { slug: 'healthy' },
    update: {},
    create: { name: 'Healthy', slug: 'healthy', description: 'Healthy recipes' },
  });

  const vegan = await prisma.tag.upsert({
    where: { slug: 'vegan' },
    update: {},
    create: { name: 'Vegan', slug: 'vegan', description: 'Plant-based recipes' },
  });

  // Get units
  const g = await prisma.unit.upsert({ where: { name: 'g' }, update: {}, create: { name: 'g' } });
  const ml = await prisma.unit.upsert({ where: { name: 'ml' }, update: {}, create: { name: 'ml' } });
  const tbsp = await prisma.unit.upsert({ where: { name: 'tbsp' }, update: {}, create: { name: 'tbsp' } });

  // Create publication
  const salad = await prisma.publication.create({
    data: {
      title: 'Salade de Tofu',
      description: ['Une salade protéinée et rafraîchissante'],
      note: ['Parfait pour un repas léger', 'Peut être préparé à l\'avance'],
      public: true,
      published: true,
    },
  });

  await prisma.publication_tag.createMany({
    data: [
      { publication_id: salad.publication_id, tag_id: healthy.tag_id },
      { publication_id: salad.publication_id, tag_id: vegan.tag_id },
    ],
  });

  // Create content
  const content = await prisma.content.create({
    data: {
      publication_id: salad.publication_id,
      total_prep_time: 30,
      prep_time_note: '20 min prep, 10 min cooking',
      serving_yield: 4,
      serving_value: 'portions',
      gallery: [],
    },
  });

  // === INGREDIENTS WITH SECTIONS ===

  // Section: Tofu
  const tofu = await prisma.product.upsert({ where: { name: 'Tofu ferme' }, update: {}, create: { name: 'Tofu ferme' } });
  const soySauce = await prisma.product.upsert({ where: { name: 'Sauce soja' }, update: {}, create: { name: 'Sauce soja' } });
  const sesameOil = await prisma.product.upsert({ where: { name: 'Huile de sésame' }, update: {}, create: { name: 'Huile de sésame' } });
  const ginger = await prisma.product.upsert({ where: { name: 'Gingembre frais' }, update: {}, create: { name: 'Gingembre frais' } });

  const tofuIngredients = [
    { product_id: tofu.product_id, quantity: 400, unit_id: g.unit_id, section: 'Tofu' },
    { product_id: soySauce.product_id, quantity: 30, unit_id: ml.unit_id, section: 'Tofu' },
    { product_id: sesameOil.product_id, quantity: 15, unit_id: ml.unit_id, section: 'Tofu' },
    { product_id: ginger.product_id, quantity: 10, unit_id: g.unit_id, note: 'Râpé', section: 'Tofu' },
  ];

  // Section: Vinaigrette
  const oliveOil = await prisma.product.upsert({ where: { name: 'Huile d\'olive' }, update: {}, create: { name: 'Huile d\'olive' } });
  const vinegar = await prisma.product.upsert({ where: { name: 'Vinaigre de riz' }, update: {}, create: { name: 'Vinaigre de riz' } });
  const mustard = await prisma.product.upsert({ where: { name: 'Moutarde de Dijon' }, update: {}, create: { name: 'Moutarde de Dijon' } });
  const honey = await prisma.product.upsert({ where: { name: 'Sirop d\'érable' }, update: {}, create: { name: 'Sirop d\'érable' } });

  const dressingIngredients = [
    { product_id: oliveOil.product_id, quantity: 60, unit_id: ml.unit_id, section: 'Vinaigrette' },
    { product_id: vinegar.product_id, quantity: 30, unit_id: ml.unit_id, section: 'Vinaigrette' },
    { product_id: mustard.product_id, quantity: 1, unit_id: tbsp.unit_id, section: 'Vinaigrette' },
    { product_id: honey.product_id, quantity: 1, unit_id: tbsp.unit_id, section: 'Vinaigrette' },
  ];

  // Section: Salade
  const lettuce = await prisma.product.upsert({ where: { name: 'Laitue romaine' }, update: {}, create: { name: 'Laitue romaine' } });
  const cherry = await prisma.product.upsert({ where: { name: 'Tomates cerises' }, update: {}, create: { name: 'Tomates cerises' } });
  const cucumber = await prisma.product.upsert({ where: { name: 'Concombre' }, update: {}, create: { name: 'Concombre' } });
  const avocado = await prisma.product.upsert({ where: { name: 'Avocat' }, update: {}, create: { name: 'Avocat' } });
  const seeds = await prisma.product.upsert({ where: { name: 'Graines de sésame' }, update: {}, create: { name: 'Graines de sésame' } });

  const saladIngredients = [
    { product_id: lettuce.product_id, quantity: 200, unit_id: g.unit_id, note: 'Coupée', section: 'Salade' },
    { product_id: cherry.product_id, quantity: 150, unit_id: g.unit_id, note: 'Coupées en deux', section: 'Salade' },
    { product_id: cucumber.product_id, quantity: 1, note: 'En dés', section: 'Salade' },
    { product_id: avocado.product_id, quantity: 1, note: 'En tranches', section: 'Salade' },
    { product_id: seeds.product_id, quantity: 2, unit_id: tbsp.unit_id, note: 'Pour garnir', section: 'Salade' },
  ];

  // Create all ingredients
  for (const ing of [...tofuIngredients, ...dressingIngredients, ...saladIngredients]) {
    const ingredient = await prisma.ingredient.create({ data: ing });
    await prisma.content_ingredient.create({
      data: { content_id: content.content_id, ingredient_id: ingredient.ingredient_id },
    });
  }

  console.log('✅ Created 13 ingredients across 3 sections');

  // === SEGMENTS WITH SECTIONS ===

  const steps = [
    {
      position: 1,
      title: 'Presser le tofu',
      paragraph: 'Envelopper le tofu dans un torchon et placer un poids dessus pendant 15 minutes pour enlever l\'excès d\'eau.',
      section: 'Préparation du tofu'
    },
    {
      position: 2,
      title: 'Couper et mariner',
      paragraph: 'Couper le tofu en cubes. Mélanger sauce soja, huile de sésame et gingembre. Faire mariner 10 minutes.',
      section: 'Préparation du tofu'
    },
    {
      position: 3,
      title: 'Cuire le tofu',
      paragraph: 'Faire dorer le tofu dans une poêle chaude 3-4 minutes de chaque côté jusqu\'à ce qu\'il soit croustillant.',
      note: 'Ne pas trop remuer pour obtenir une belle coloration',
      section: 'Préparation du tofu'
    },
    {
      position: 4,
      title: 'Préparer la vinaigrette',
      paragraph: 'Dans un petit bol, fouetter ensemble l\'huile d\'olive, le vinaigre, la moutarde et le sirop d\'érable.',
      note: 'Goûter et ajuster l\'assaisonnement',
      section: 'Vinaigrette'
    },
    {
      position: 5,
      title: 'Préparer les légumes',
      paragraph: 'Laver et couper la laitue. Couper les tomates en deux, le concombre en dés et l\'avocat en tranches.',
      section: 'Assemblage'
    },
    {
      position: 6,
      title: 'Assembler',
      paragraph: 'Dans un grand saladier, mélanger la laitue, les tomates, le concombre. Ajouter le tofu chaud.',
      section: 'Assemblage'
    },
    {
      position: 7,
      title: 'Servir',
      paragraph: 'Arroser de vinaigrette, ajouter les tranches d\'avocat et parsemer de graines de sésame.',
      note: 'Servir immédiatement pendant que le tofu est encore chaud',
      section: 'Assemblage'
    },
  ];

  for (const step of steps) {
    const segment = await prisma.segment.create({
      data: {
        title: step.title,
        paragraph: step.paragraph,
        note: step.note,
        section: step.section
      }
    });
    await prisma.content_segment.create({
      data: { content_id: content.content_id, segment_id: segment.segment_id, position: step.position },
    });
  }

  console.log('✅ Created 7 steps across 3 sections');
  console.log('🎉 Tofu Salad created with sectioned ingredients and steps!');

  await prisma.$disconnect();
})();
