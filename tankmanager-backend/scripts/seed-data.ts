import 'dotenv/config';
import { PrismaClient, CounterType, FuelType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/tankmanager';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seeding...');

  // Ensure default company exists
  const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
  await prisma.company.upsert({
    where: { id: DEFAULT_COMPANY_ID },
    update: {},
    create: {
      id: DEFAULT_COMPANY_ID,
      name: 'Moosmühle GmbH',
      domain: 'moosmuehle.com',
      email: 'info@moosmuehle.com',
      active: true,
    },
  });

  // 1. Erstelle Betriebe
  console.log('Creating owners...');
  const owners = await Promise.all([
    prisma.owner.upsert({
      where: { id: 'owner-1' },
      update: {},
      create: {
        id: 'owner-1',
        companyId: DEFAULT_COMPANY_ID,
        name: 'Hauptbetrieb Berlin',
        notes: 'Zentrale Berlin',
      },
    }),
    prisma.owner.upsert({
      where: { id: 'owner-2' },
      update: {},
      create: {
        id: 'owner-2',
        companyId: DEFAULT_COMPANY_ID,
        name: 'Betrieb München',
        notes: 'Niederlassung München',
      },
    }),
    prisma.owner.upsert({
      where: { id: 'owner-3' },
      update: {},
      create: {
        id: 'owner-3',
        companyId: DEFAULT_COMPANY_ID,
        name: 'Betrieb Hamburg',
        notes: 'Niederlassung Hamburg',
      },
    }),
  ]);

  // 2. Erstelle Kategorien
  console.log('Creating categories...');
  let categoryAbroll = await prisma.category.findFirst({
    where: { name: 'Abrollcontainer' },
  });
  if (!categoryAbroll) {
    categoryAbroll = await prisma.category.create({
      data: {
        name: 'Abrollcontainer',
        hasEngine: false,
        inventoryPrefix: 'AR',
        inventoryMiddleHint: 'm³ angeben',
        notes: 'Container für Abfallentsorgung',
      },
    });
  }

  let categoryRadlader = await prisma.category.findFirst({
    where: { name: 'Radlader' },
  });
  if (!categoryRadlader) {
    categoryRadlader = await prisma.category.create({
      data: {
        name: 'Radlader',
        hasEngine: true,
        inventoryPrefix: 'RL',
        notes: 'Radlader für Baustellen',
      },
    });
  }

  let categoryBagger = await prisma.category.findFirst({
    where: { name: 'Bagger' },
  });
  if (!categoryBagger) {
    categoryBagger = await prisma.category.create({
      data: {
        name: 'Bagger',
        hasEngine: true,
        inventoryPrefix: 'BG',
        notes: 'Bagger verschiedener Größen',
      },
    });
  }

  let categoryLkw = await prisma.category.findFirst({ where: { name: 'LKW' } });
  if (!categoryLkw) {
    categoryLkw = await prisma.category.create({
      data: {
        name: 'LKW',
        hasEngine: true,
        inventoryPrefix: 'LK',
        notes: 'Lastkraftwagen',
      },
    });
  }

  let categoryStapler = await prisma.category.findFirst({
    where: { name: 'Stapler' },
  });
  if (!categoryStapler) {
    categoryStapler = await prisma.category.create({
      data: {
        name: 'Stapler',
        hasEngine: true,
        inventoryPrefix: 'ST',
        notes: 'Gabelstapler',
      },
    });
  }

  let categoryGeruest = await prisma.category.findFirst({
    where: { name: 'Gerüst' },
  });
  if (!categoryGeruest) {
    categoryGeruest = await prisma.category.create({
      data: {
        name: 'Gerüst',
        hasEngine: false,
        inventoryPrefix: 'GR',
        notes: 'Baugerüste',
      },
    });
  }

  // 3. Erstelle 120 Abrollcontainer
  console.log('Creating 120 Abrollcontainer...');
  const containerSizes = ['5', '7', '10', '12', '15', '20', '30', '38'];
  const manufacturers = ['Kröger', 'Meiller', 'Schmitz', 'Fliegl'];

  for (let i = 1; i <= 120; i++) {
    const owner = owners[i % owners.length];
    const size = containerSizes[i % containerSizes.length];
    const manufacturer = manufacturers[i % manufacturers.length];

    await prisma.machine.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        ownerId: owner.id,
        categoryId: categoryAbroll.id,
        inventoryMiddle: size,
        inventoryNo: `AR-${size}-${String(i).padStart(3, '0')}`,
        designation: `${size}m³ Container`,
        manufacturer: manufacturer,
        buildYear: 2015 + (i % 10),
        counterType: CounterType.NONE,
        counterStartValue: 0,
        notes: `Abrollcontainer ${size} m³`,
      },
    });

    if (i % 20 === 0) {
      console.log(`  Created ${i}/120 containers...`);
    }
  }

  // 4. Erstelle 15 Radlader
  console.log('Creating 15 Radlader...');
  const radladerModels = ['CAT 950', 'Volvo L90', 'Liebherr L556', 'JCB 427'];
  for (let i = 1; i <= 15; i++) {
    const owner = owners[i % owners.length];
    const model = radladerModels[i % radladerModels.length];

    await prisma.machine.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        ownerId: owner.id,
        categoryId: categoryRadlader.id,
        inventoryNo: `RL-${String(i).padStart(3, '0')}`,
        designation: `Radlader ${model}`,
        manufacturer: model.split(' ')[0],
        modelType: model,
        buildYear: 2018 + (i % 7),
        counterType: CounterType.HOURS,
        counterStartValue: 100 * i,
        counterCurrent: 100 * i + Math.floor(Math.random() * 500),
        primaryFuelType: FuelType.DIESEL,
        adBlueRequired: i % 3 === 0,
        stvzoApproved: false,
      },
    });
  }

  // 5. Erstelle 12 Bagger
  console.log('Creating 12 Bagger...');
  const baggerModels = [
    'CAT 320',
    'Volvo EC220',
    'Liebherr R924',
    'Hitachi ZX210',
  ];
  for (let i = 1; i <= 12; i++) {
    const owner = owners[i % owners.length];
    const model = baggerModels[i % baggerModels.length];

    await prisma.machine.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        ownerId: owner.id,
        categoryId: categoryBagger.id,
        inventoryNo: `BG-${String(i).padStart(3, '0')}`,
        designation: `Bagger ${model}`,
        manufacturer: model.split(' ')[0],
        modelType: model,
        buildYear: 2017 + (i % 8),
        counterType: CounterType.HOURS,
        counterStartValue: 200 * i,
        counterCurrent: 200 * i + Math.floor(Math.random() * 800),
        primaryFuelType: FuelType.DIESEL,
        adBlueRequired: true,
        stvzoApproved: false,
      },
    });
  }

  // 6. Erstelle 18 LKW
  console.log('Creating 18 LKW...');
  const lkwModels = [
    'Mercedes Actros',
    'MAN TGX',
    'Scania R450',
    'Volvo FH16',
    'Iveco Stralis',
  ];
  for (let i = 1; i <= 18; i++) {
    const owner = owners[i % owners.length];
    const model = lkwModels[i % lkwModels.length];
    const licensePlates = [
      'B-AB 1234',
      'M-CD 5678',
      'HH-EF 9012',
      'DO-GH 3456',
    ];

    await prisma.machine.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        ownerId: owner.id,
        categoryId: categoryLkw.id,
        inventoryNo: `LK-${String(i).padStart(3, '0')}`,
        designation: `LKW ${model}`,
        manufacturer: model.split(' ')[0],
        modelType: model,
        buildYear: 2016 + (i % 9),
        counterType: CounterType.KM,
        counterStartValue: 10000 * i,
        counterCurrent: 10000 * i + Math.floor(Math.random() * 50000),
        primaryFuelType: FuelType.DIESEL,
        adBlueRequired: true,
        stvzoApproved: true,
        licensePlate: licensePlates[i % licensePlates.length],
      },
    });
  }

  // 7. Erstelle 10 Stapler
  console.log('Creating 10 Stapler...');
  const staplerModels = [
    'Linde H25',
    'Still RX70',
    'Jungheinrich EFG',
    'Toyota 8FBE',
  ];
  for (let i = 1; i <= 10; i++) {
    const owner = owners[i % owners.length];
    const model = staplerModels[i % staplerModels.length];
    const isElectric = i % 3 === 0;

    await prisma.machine.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        ownerId: owner.id,
        categoryId: categoryStapler.id,
        inventoryNo: `ST-${String(i).padStart(3, '0')}`,
        designation: `Stapler ${model}`,
        manufacturer: model.split(' ')[0],
        modelType: model,
        buildYear: 2019 + (i % 6),
        counterType: CounterType.HOURS,
        counterStartValue: 50 * i,
        counterCurrent: 50 * i + Math.floor(Math.random() * 300),
        primaryFuelType: isElectric ? FuelType.ELECTRIC : FuelType.DIESEL,
        adBlueRequired: false,
        stvzoApproved: false,
      },
    });
  }

  // 8. Erstelle 20 Gerüste
  console.log('Creating 20 Gerüste...');
  const geruestTypes = [
    'Fassadengerüst',
    'Rollgerüst',
    'Arbeitsgerüst',
    'Schutzgerüst',
  ];
  for (let i = 1; i <= 20; i++) {
    const owner = owners[i % owners.length];
    const type = geruestTypes[i % geruestTypes.length];

    await prisma.machine.create({
      data: {
        companyId: DEFAULT_COMPANY_ID,
        ownerId: owner.id,
        categoryId: categoryGeruest.id,
        inventoryMiddle: String(10 + i),
        inventoryNo: `GR-${10 + i}-${String(i).padStart(3, '0')}`,
        designation: `${type} ${10 + i}m`,
        manufacturer: ['Layher', 'Plettac', 'Hünnebeck'][i % 3],
        buildYear: 2010 + (i % 15),
        counterType: CounterType.NONE,
        counterStartValue: 0,
        notes: `${type} mit ${10 + i}m Höhe`,
      },
    });
  }

  console.log('✅ Seeding completed!');
  console.log(`
Summary:
- 3 Betriebe erstellt
- 6 Kategorien erstellt
- 120 Abrollcontainer
- 15 Radlader
- 12 Bagger
- 18 LKW
- 10 Stapler
- 20 Gerüste
Total: 195 Maschinen/Geräte
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
