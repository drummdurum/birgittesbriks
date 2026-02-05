const { prisma } = require('../database/prisma');

const users = [
  { navn: 'Anders', efternavn: 'Jacobsen', telefon: '25665931' },
  { navn: 'Berit', efternavn: 'Byrian', telefon: '22369248' },
  { navn: 'Fia', efternavn: 'Athene Isabella Rasmussen', telefon: '29651287' },
  { navn: 'Fie', efternavn: 'Gallorini Petersson', telefon: '61781989' },
  { navn: 'Kirsten', efternavn: 'Marie Andersson', telefon: '61469191' },
  { navn: 'Laila', efternavn: 'Ravn', telefon: '27574665' },
  { navn: 'Lotte', efternavn: 'Møller', telefon: '26364464' },
  { navn: 'Louise', efternavn: 'Boss', telefon: '53685884' },
  { navn: 'Louise', efternavn: 'Wagner Saustrup', telefon: '81610256' },
  { navn: 'Maria', efternavn: 'Kornum Trustmann', telefon: '29410434' },
  { navn: 'Malene', efternavn: 'Svendsen Holm-Møller', telefon: '28769987' },
  { navn: 'Mia', efternavn: 'Thorning', telefon: '52190997' },
  { navn: 'Niels-Jørg', efternavn: 'Hedelynge', telefon: '41819393' },
  { navn: 'Nina', efternavn: 'Ingeberg', telefon: '26206422' },
  { navn: 'Solgerd', efternavn: 'Olsen', telefon: '21721714' },
  { navn: 'Stine', efternavn: 'Elken', telefon: '31492317' },
  { navn: 'Sussi', efternavn: 'Pagh', telefon: '22559552' },
  { navn: 'Tanja', efternavn: 'Olsen', telefon: '42362729' },
  { navn: 'Tina', efternavn: 'Langstrup Petersen', telefon: '24781159' },
  { navn: 'Tina', efternavn: 'Søgaard Jensen', telefon: '29762853' },
  { navn: 'Tine', efternavn: 'Nicole Jespersen', telefon: '30705857' },
  { navn: 'Vicki', efternavn: 'Meilstrup', telefon: '41996414' },
  { navn: 'Victor', efternavn: 'Øager Byrian', telefon: '71772125' },
  { navn: 'Temistocles', efternavn: 'de Jesus Gonzales Mendoza', telefon: '30266929' }
];

async function importUsers() {
  try {
    console.log(`Importerer ${users.length} brugere...`);
    
    let created = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        const existingUser = await prisma.user.findFirst({
          where: { telefon: user.telefon }
        });

        if (existingUser) {
          console.log(`✓ Bruger eksisterer allerede: ${user.navn} ${user.efternavn} (${user.telefon})`);
          skipped++;
        } else {
          await prisma.user.create({
            data: {
              navn: user.navn,
              efternavn: user.efternavn,
              email: 'test@test.dk',
              telefon: user.telefon
            }
          });
          console.log(`✓ Oprettet: ${user.navn} ${user.efternavn} (${user.telefon})`);
          created++;
        }
      } catch (err) {
        console.error(`✗ Fejl for ${user.navn} ${user.efternavn}: ${err.message}`);
      }
    }

    console.log(`\n✅ Import færdig: ${created} oprettet, ${skipped} eksisterede allerede`);
  } catch (error) {
    console.error('Import fejl:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importUsers();
