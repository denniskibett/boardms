import 'dotenv/config';
import { query } from './db';
import bcrypt from 'bcrypt';

export const seedInitialData = async () => {
  try {
    console.log('🌱 Seeding initial data...');




    // 1. Insert Clusters
    console.log('📊 Seeding clusters...');
    const clusters = [
      { name: 'Governance, Justice & Law & Order', description: 'Governance and legal affairs cluster' },
      { name: 'Economic Affairs', description: 'Economic development and planning cluster' },
      { name: 'Infrastructure', description: 'Infrastructure development cluster' },
      { name: 'Social Services', description: 'Social services and welfare cluster' },
      { name: 'Production & Manufacturing', description: 'Production and manufacturing cluster' },
      { name: 'Environment & Natural Resources', description: 'Environment and natural resources cluster' },
      { name: 'Regional Development', description: 'Regional development and integration cluster' }
    ];

    for (const cluster of clusters) {
      await query(
        `INSERT INTO clusters (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [cluster.name, cluster.description]
      );
    }

    // 2. Insert Ministries
    console.log('🏛️ Seeding ministries...');

    // 1️⃣ Get all users to map names → IDs
    const usersResult = await query('SELECT id, name FROM users');
    const userMap = new Map<string, number>();
    for (const u of usersResult.rows) {
      userMap.set(u.name.trim(), u.id);
    }

    const ministries = [
      // Governance, Justice & Law & Order Cluster
      { name: 'The Office of the Attorney-General and Department of Justice', acronym: 'AG', cluster: 'Governance, Justice & Law & Order', cs: 'Ms. Dorcas Agik Oduor', hq: 'Sheria House, Nairobi', website: 'https://www.statelaw.go.ke', email: 'info@attorneygeneral.go.ke', phone: '+254-20-2222222' },
      { name: 'Ministry of Interior and National Administration', acronym: 'Interior', cluster: 'Governance, Justice & Law & Order', cs: 'Kipchumba Murkomen', hq: 'Harambee House, Nairobi', website: 'https://www.interior.go.ke', email: 'info@interior.go.ke', phone: '+254-20-2227411' },
      { name: 'Ministry of Foreign and Diaspora Affairs', acronym: 'Foreign Affairs', cluster: 'Governance, Justice & Law & Order', cs: 'Musalia Mudavadi', hq: 'Old Treasury Building, Nairobi', website: 'https://www.foreignaffairs.go.ke', email: 'info@foreignaffairs.go.ke', phone: '+254-20-3318888' },
      { name: 'Ministry of Defence', acronym: 'Defence', cluster: 'Governance, Justice & Law & Order', cs: 'Aden Duale', hq: 'Defence Headquarters, Nairobi', website: 'https://www.mod.go.ke', email: 'info@mod.go.ke', phone: '+254-20-2726000' },
      { name: 'Ministry of Public Service and Human Capital Development', acronym: 'Public Service', cluster: 'Governance, Justice & Law & Order', cs: 'Moses Kuria', hq: 'NSSF Building, Nairobi', website: 'https://www.publicservice.go.ke', email: 'info@publicservice.go.ke', phone: '+254-20-2227460' },
      
      // Economic Affairs Cluster
      { name: 'The National Treasury and Economic Planning', acronym: 'Treasury', cluster: 'Economic Affairs', cs: 'Njuguna Ndung\'u', hq: 'Treasury Building, Nairobi', website: 'https://www.treasury.go.ke', email: 'info@treasury.go.ke', phone: '+254-20-2252300' },
      { name: 'Ministry of Information, Communication and the Digital Economy', acronym: 'ICT', cluster: 'Economic Affairs', cs: 'Eliud Owalo', hq: 'Telposta Towers, Nairobi', website: 'https://www.ict.go.ke', email: 'info@ict.go.ke', phone: '+254-20-2089061' },
      { name: 'Ministry of Investment, Trade and Industry', acronym: 'Investment', cluster: 'Economic Affairs', cs: 'Rebecca Miano', hq: 'Co-operative Bank House, Nairobi', website: 'https://www.investment.go.ke', email: 'info@investment.go.ke', phone: '+254-20-3318888' },
      { name: 'Ministry of Cooperatives and MSME Development', acronym: 'Cooperatives', cluster: 'Economic Affairs', cs: 'Simon Chelugui', hq: 'Co-operative Bank House, Nairobi', website: 'https://www.cooperatives.go.ke', email: 'info@cooperatives.go.ke', phone: '+254-20-2712801' },
      
      // Infrastructure Cluster
      { name: 'Ministry of Roads and Transport', acronym: 'Transport', cluster: 'Infrastructure', cs: 'Kipchumba Murkomen', hq: 'Transcom House, Nairobi', website: 'https://www.transport.go.ke', email: 'info@transport.go.ke', phone: '+254-20-2729200' },
      { name: 'Ministry of Lands, Housing and Urban Development', acronym: 'Lands', cluster: 'Infrastructure', cs: 'Alice Wahome', hq: 'Ardhi House, Nairobi', website: 'https://www.lands.go.ke', email: 'info@lands.go.ke', phone: '+254-20-2718050' },
      { name: 'Ministry of Water, Sanitation and Irrigation', acronym: 'Water', cluster: 'Infrastructure', cs: 'Zachariah Njeru', hq: 'Majestic House, Nairobi', website: 'https://www.water.go.ke', email: 'info@water.go.ke', phone: '+254-20-2716103' },
      { name: 'Ministry of Energy and Petroleum', acronym: 'Energy', cluster: 'Infrastructure', cs: 'Davis Chirchir', hq: 'Nyayo House, Nairobi', website: 'https://www.energy.go.ke', email: 'info@energy.go.ke', phone: '+254-20-3101120' },
      
      // Social Services Cluster
      { name: 'Ministry of Health', acronym: 'Health', cluster: 'Social Services', cs: 'Susan Nakhumicha', hq: 'Afya House, Nairobi', website: 'https://www.health.go.ke', email: 'info@health.go.ke', phone: '+254-20-2717077' },
      { name: 'Ministry of Education', acronym: 'Education', cluster: 'Social Services', cs: 'Ezekiel Machogu', hq: 'Jogoo House, Nairobi', website: 'https://www.education.go.ke', email: 'info@education.go.ke', phone: '+254-20-3318581' },
      { name: 'Ministry of Youth Affairs, Creative Economy and Sports', acronym: 'Youth', cluster: 'Social Services', cs: 'Ababu Namwamba', hq: 'Kencom House, Nairobi', website: 'https://www.youth.go.ke', email: 'info@youth.go.ke', phone: '+254-20-2210941' },
      { name: 'Ministry of Labour and Social Protection', acronym: 'Labour', cluster: 'Social Services', cs: 'Florence Bore', hq: 'Social Security House, Nairobi', website: 'https://www.labour.go.ke', email: 'info@labour.go.ke', phone: '+254-20-2729800' },
      { name: 'Ministry of Gender, Culture, The Arts and Heritage', acronym: 'Gender', cluster: 'Social Services', cs: 'Aisha Jumwa', hq: 'National Museums of Kenya, Nairobi', website: 'https://www.gender.go.ke', email: 'info@gender.go.ke', phone: '+254-20-3742161' },
      
      // Production & Manufacturing Cluster
      { name: 'Ministry of Agriculture and Livestock Development', acronym: 'Agriculture', cluster: 'Production & Manufacturing', cs: 'Mithika Linturi', hq: 'Kilimo House, Nairobi', website: 'https://www.agriculture.go.ke', email: 'info@kilimo.go.ke', phone: '+254-20-2718870' },
      { name: 'Ministry of Mining, Blue Economy and Maritime Affairs', acronym: 'Mining', cluster: 'Production & Manufacturing', cs: 'Salim Mvurya', hq: 'Ministry of Mining, Nairobi', website: 'https://www.mining.go.ke', email: 'info@mining.go.ke', phone: '+254-20-2723101' },
      
      // Environment & Natural Resources Cluster
      { name: 'Ministry of Environment, Climate Change and Forestry', acronym: 'Environment', cluster: 'Environment & Natural Resources', cs: 'Soipan Tuya', hq: 'NHIF Building, Nairobi', website: 'https://www.environment.go.ke', email: 'info@environment.go.ke', phone: '+254-20-2731571' },
      { name: 'Ministry of Tourism and Wildlife', acronym: 'Tourism', cluster: 'Environment & Natural Resources', cs: 'Alfred Mutua', hq: 'Utalii House, Nairobi', website: 'https://www.tourism.go.ke', email: 'info@tourism.go.ke', phone: '+254-20-2711322' },
      
      // Regional Development Cluster
      { name: 'Ministry of East African Community, ASALs and Regional Development', acronym: 'EAC', cluster: 'Regional Development', cs: 'Peninah Malonza', hq: 'Jogoo House, Nairobi', website: 'https://www.eac.go.ke', email: 'info@eac.go.ke', phone: '+254-20-3318888' }
    ];

    
    // 3️⃣ Insert ministries with user.id as cabinet_secretary
    for (const ministry of ministries) {
      const clusterResult = await query('SELECT id FROM clusters WHERE name = $1', [ministry.cluster]);
      const clusterId = clusterResult.rows[0]?.id || null;

      const csId = userMap.get(ministry.cs.trim()) || null;

      if (!csId) {
        console.warn(`⚠️ Warning: No user found for CS "${ministry.cs}" — inserting ministry "${ministry.name}" with NULL CS`);
      }

      await query(
        `INSERT INTO ministries (name, acronym, cluster_id, cabinet_secretary, headquarters, website, email, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO NOTHING`,
        [ministry.name, ministry.acronym, clusterId, csId, ministry.hq, ministry.website, ministry.email, ministry.phone]
      );
    }


    console.log('✅ Ministries seeded successfully.');

    // 3. Insert ALL State Departments
    console.log('📋 Seeding state departments...');
    
    const stateDepartments = [
      // Ministry of Interior and National Administration
      { acronym: 'Interior', name: 'State Department for Internal Security and National Administration', ps: 'Dr. Raymond Omollo', location: 'Harambee House, Nairobi', email: 'psinternalsecurity@interior.go.ke', website:'interior.go.ke', phone: '+254-20-2227411' },
      { acronym: 'Interior', name: 'State Department for Correctional Services', ps: 'Ms. Salome Wairimu Muhia-Beacco', location: 'Harambee House, Nairobi', email: 'pscorrectional@interior.go.ke', website:'interior.go.ke', phone: '+254-20-2227412' },
      { acronym: 'Interior', name: 'State Department for Immigration and Citizen Services', ps: 'Prof. Julius Bitok', location: 'Nyayo House, Nairobi', email: 'psimmigration@immigration.go.ke', website:'immigration.go.ke', phone: '+254-20-2222021' },

      // Ministry of Health
      { acronym: 'Health', name: 'State Department for Medical Services', ps: 'Ms. Mary Muthoni Muriuki', location: 'Afya House, Nairobi', email: 'psmedicalservices@health.go.ke', website:'health.go.ke', phone: '+254-20-2717077' },
      { acronym: 'Health', name: 'State Department for Public Health and Professional Standards', ps: 'Dr. Mary Muthoni Muriuki', location: 'Afya House, Nairobi', email: 'pspublichealth@health.go.ke', website:'health.go.ke', phone: '+254-20-2717078' },

      // Ministry of Education
      { acronym: 'Education', name: 'State Department for Basic Education', ps: 'Dr. Belio Kipsang', location: 'Jogoo House, Nairobi', email: 'psbasiceducation@education.go.ke', website:'education.go.ke', phone: '+254-20-3318581' },
      { acronym: 'Education', name: 'State Department for Technical, Vocational Education & Training', ps: 'Dr. Esther Mworia', location: 'Jogoo House, Nairobi', email: 'pstvet@education.go.ke', website:'education.go.ke', phone: '+254-20-3318582' },
      { acronym: 'Education', name: 'State Department for Higher Education and Research', ps: 'Dr. Beatrice Inyangala', location: 'Jogoo House, Nairobi', email: 'pshighereducation@education.go.ke', website:'education.go.ke', phone: '+254-20-3318583' },

      // The National Treasury and Economic Planning
      { acronym: 'Treasury', name: 'State Department for National Treasury', ps: 'Dr. Chris Kiptoo', location: 'Treasury Building, Nairobi', email: 'ps@treasury.go.ke', website:'treasury.go.ke', phone: '+254-20-2252300' },
      { acronym: 'Treasury', name: 'State Department for Economic Planning', ps: 'Mr. James Muhati', location: 'Treasury Building, Nairobi', email: 'planning@treasury.go.ke', website:'treasury.go.ke', phone: '+254-20-2252301' },

      // Ministry of Roads and Transport
      { acronym: 'Transport', name: 'State Department for Roads', ps: 'Eng. Joseph M. Mbugua', location: 'Transcom House, Nairobi', email: 'psroads@transport.go.ke', website:'transport.go.ke', phone: '+254-20-2729200' },
      { acronym: 'Transport', name: 'State Department for Transport', ps: 'Mr. Mohamed Daghar', location: 'Transcom House, Nairobi', email: 'pstransport@transport.go.ke', website:'transport.go.ke', phone: '+254-20-2729300' },

      // Ministry of Lands, Housing and Urban Development
      { acronym: 'Lands', name: 'State Department for Lands and Physical Planning', ps: 'Mr. Nixon Korir', location: 'Ardhi House, Nairobi', email: 'pslands@lands.go.ke', website:'lands.go.ke', phone: '+254-20-2718050' },
      { acronym: 'Lands', name: 'State Department for Housing and Urban Development', ps: 'Mr. Charles Hinga Mwaura', location: 'Ardhi House, Nairobi', email: 'pshousing@lands.go.ke', website:'lands.go.ke', phone: '+254-20-2718051' },
      { acronym: 'Lands', name: 'State Department for Public Works', ps: 'Prof. Joel K. M. Mburu', location: 'Ardhi House, Nairobi', email: 'pspublicworks@publicworks.go.ke', website:'publicworks.go.ke', phone: '+254-20-2718052' },

      // Ministry of Information, Communication and the Digital Economy
      { acronym: 'ICT', name: 'State Department for Broadcasting and Telecommunications', ps: 'Prof. Edward Kisiang\'ani', location: 'Telposta Towers, Nairobi', email: 'psbroadcasting@ict.go.ke', website:'ict.go.ke', phone: '+254-20-2089061' },
      { acronym: 'ICT', name: 'State Department for ICT and the Digital Economy', ps: 'Eng. John Tanui', location: 'Telposta Towers, Nairobi', email: 'psict@ict.go.ke', website:'ict.go.ke', phone: '+254-20-2089062' },

      // Ministry of Agriculture and Livestock Development
      { acronym: 'Agriculture', name: 'State Department for Agriculture', ps: 'Dr. Paul Ronoh', location: 'Kilimo House, Nairobi', email: 'psagriculture@kilimo.go.ke', website:'kilimo.go.ke', phone: '+254-20-2718870' },
      { acronym: 'Agriculture', name: 'State Department for Livestock Development', ps: 'Mr. Jonathan Mueke', location: 'Kilimo House, Nairobi', email: 'pslivestock@kilimo.go.ke', website:'kilimo.go.ke', phone: '+254-20-2718871' },

      // Ministry of Investment, Trade and Industry
      { acronym: 'Investment', name: 'State Department for Investment Promotion', ps: 'Mr. Abubakar Hassan', location: 'Co-operative Bank House, Nairobi', email: 'psinvestment@investment.go.ke', website:'investment.go.ke', phone: '+254-20-3318889' },
      { acronym: 'Investment', name: 'State Department for Trade', ps: 'Mr. Alfred K\'Ombudo', location: 'Co-operative Bank House, Nairobi', email: 'pstrade@trade.go.ke', website:'trade.go.ke', phone: '+254-20-3318890' },
      { acronym: 'Investment', name: 'State Department for Industry', ps: 'Dr. Juma Mukhwana', location: 'Co-operative Bank House, Nairobi', email: 'psindustry@trade.go.ke', website:'trade.go.ke', phone: '+254-20-3318891' },

      // Ministry of Cooperatives and MSME Development
      { acronym: 'Cooperatives', name: 'State Department for Cooperatives', ps: 'Mr. Patrick Kilemi', location: 'Co-operative Bank House, Nairobi', email: 'pscooperatives@cooperatives.go.ke', website:'cooperatives.go.ke', phone: '+254-20-2712801' },
      { acronym: 'Cooperatives', name: 'State Department for MSME Development', ps: 'Ms. Susan Mang\'eni', location: 'Co-operative Bank House, Nairobi', email: 'psmsme@cooperatives.go.ke', website:'cooperatives.go.ke', phone: '+254-20-2712802' },

      // Ministry of Youth Affairs, Creative Economy and Sports
      { acronym: 'Youth', name: 'State Department for Youth Affairs and Creative Economy', ps: 'Mr. Ismail Maalim Madey', location: 'Kencom House, Nairobi', email: 'psyouth@youth.go.ke', website:'youth.go.ke', phone: '+254-20-2210941' },
      { acronym: 'Youth', name: 'State Department for Sports', ps: 'Eng. Peter Tum', location: 'Kencom House, Nairobi', email: 'pssports@youth.go.ke', website:'youth.go.ke', phone: '+254-20-2210942' },

      // Ministry of Environment, Climate Change and Forestry
      { acronym: 'Environment', name: 'State Department for Environment and Climate Change', ps: 'Eng. Festus Ngeno', location: 'NHIF Building, Nairobi', email: 'psenvironment@environment.go.ke', website:'environment.go.ke', phone: '+254-20-2731571' },
      { acronym: 'Environment', name: 'State Department for Forestry', ps: 'Mr. Gitonga Mugambi', location: 'NHIF Building, Nairobi', email: 'psforestry@environment.go.ke', website:'environment.go.ke', phone: '+254-20-2731572' },

      // Ministry of Tourism and Wildlife
      { acronym: 'Tourism', name: 'State Department for Tourism', ps: 'Mr. John Ololtuaa', location: 'Utalii House, Nairobi', email: 'pstourism@tourism.go.ke', website:'tourism.go.ke', phone: '+254-20-2711322' },
      { acronym: 'Tourism', name: 'State Department for Wildlife', ps: 'Ms. Silvia Museiya Kihoro', location: 'Utalii House, Nairobi', email: 'pswildlife@tourism.go.ke', website:'tourism.go.ke', phone: '+254-20-2711323' },

      // Ministry of Water, Sanitation and Irrigation
      { acronym: 'Water', name: 'State Department for Water and Sanitation', ps: 'Dr. Julius Korir', location: 'Majestic House, Nairobi', email: 'pswater@water.go.ke', website:'water.go.ke', phone: '+254-20-2716103' },
      { acronym: 'Water', name: 'State Department for Irrigation', ps: 'Eng. Ephantus Kimani', location: 'Majestic House, Nairobi', email: 'psirrigation@water.go.ke', website:'water.go.ke', phone: '+254-20-2716104' },

      // Ministry of Energy and Petroleum
      { acronym: 'Energy', name: 'State Department for Energy', ps: 'Mr. Alex Wachira', location: 'Nyayo House, Nairobi', email: 'psenergy@energy.go.ke', website:'energy.go.ke', phone: '+254-20-3101120' },
      { acronym: 'Energy', name: 'State Department for Petroleum', ps: 'Mr. Mohamed Liban', location: 'Nyayo House, Nairobi', email: 'pspetroleum@energy.go.ke', website:'energy.go.ke', phone: '+254-20-3101121' },

      // Ministry of East African Community, ASALs and Regional Development
      { acronym: 'EAC', name: 'State Department for East African Community', ps: 'Ms. Joyce Mose', location: 'Jogoo House, Nairobi', email: 'pseac@eac.go.ke', website:'eac.go.ke', phone: '+254-20-3318888' },
      { acronym: 'EAC', name: 'State Department for ASALs and Regional Development', ps: 'Mr. Idris Dokota', location: 'Jogoo House, Nairobi', email: 'psasals@devolution.go.ke', website:'devolution.go.ke', phone: '+254-20-3318889' },

      // Ministry of Mining, Blue Economy and Maritime Affairs
      { acronym: 'Mining', name: 'State Department for Mining', ps: 'Mr. Elijah Mwangi', location: 'Ministry of Mining, Nairobi', email: 'psmining@mining.go.ke', website:'mining.go.ke', phone: '+254-20-2723101' },
      { acronym: 'Mining', name: 'State Department for Blue Economy and Fisheries', ps: 'Dr. Francis Owino', location: 'Ministry of Mining, Nairobi', email: 'psblueeconomy@fisheries.go.ke', website:'fisheries.go.ke', phone: '+254-20-2723102' },
      { acronym: 'Mining', name: 'State Department for Shipping and Maritime Affairs', ps: 'Mr. Geoffrey Kaituko', location: 'Ministry of Mining, Nairobi', email: 'psshipping@maritime.go.ke', website:'maritime.go.ke', phone: '+254-20-2723103' },

      // Ministry of Labour and Social Protection
      { acronym: 'Labour', name: 'State Department for Labour and Skills Development', ps: 'Mr. Shadrack Mwadime', location: 'Social Security House, Nairobi', email: 'pslabour@labour.go.ke', website:'labour.go.ke', phone: '+254-20-2729800' },
      { acronym: 'Labour', name: 'State Department for Social Protection and Senior Citizen Affairs', ps: 'Mr. Joseph Motari', location: 'Social Security House, Nairobi', email: 'pssocialprotection@labour.go.ke', website:'labour.go.ke', phone: '+254-20-2729801' },

      // Ministry of Public Service and Human Capital Development
      { acronym: 'Public Service', name: 'State Department for Public Service', ps: 'Mr. Amos Gathecha', location: 'NSSF Building, Nairobi', email: 'pspublicservice@publicservice.go.ke', website:'publicservice.go.ke', phone: '+254-20-2227460' },
      { acronym: 'Public Service', name: 'State Department for Performance and Delivery Management', ps: 'Ms. Veronica Nduva', location: 'Harambee House Annex, Nairobi', email: 'psperformance@publicservice.go.ke', website:'publicservice.go.ke', phone: '+254-20-2227462' },

      // Ministry of Gender, Culture, The Arts and Heritage
      { acronym: 'Gender', name: 'State Department for Gender and Affirmative Action', ps: 'Ms. Veronica Nduva', location: 'NSSF Building, Nairobi', email: 'psgender@publicservice.go.ke', website:'publicservice.go.ke', phone: '+254-20-2227461' },
      { acronym: 'Gender', name: 'State Department for Culture, the Arts and Heritage', ps: 'Ms. Ummi Bashir', location: 'National Museums of Kenya, Nairobi', email: 'psculture@culture.go.ke', website:'culture.go.ke', phone: '+254-20-3742161' },

      // The Office of the Attorney-General and Department of Justice
      { acronym: 'AG', name: 'State Department for Justice', ps: 'Ms. Deborah K. Muthoni', location: 'Sheria House, Nairobi', email: 'psjustice@stateLawOffice.go.ke', website:'stateLawOffice.go.ke', phone: '+254-20-2772000' },

      // Ministry of Foreign and Diaspora Affairs
      { acronym: 'Foreign Affairs', name: 'State Department for Foreign Affairs', ps: 'Dr. Korir Sing\'oei', location: 'Ministry of Foreign Affairs, Nairobi', email: 'ps@foreignaffairs.go.ke', website:'foreignaffairs.go.ke', phone: '+254-20-3318888' },
      { acronym: 'Foreign Affairs', name: 'State Department for Diaspora Affairs', ps: 'Ms. Roseline Njogu', location: 'Ministry of Foreign Affairs, Nairobi', email: 'diaspora@foreignaffairs.go.ke', website:'foreignaffairs.go.ke', phone: '+254-20-3318892' },

      // Ministry of Defence
      { acronym: 'Defence', name: 'State Department of Defence', ps: 'Mr. Patrick Mariru', location: 'Defence Headquarters, Nairobi', email: 'ps@defence.go.ke', website:'defence.go.ke', phone: '+254-20-2726000' }
    ];

    for (const dept of stateDepartments) {
      const ministryResult = await query('SELECT id FROM ministries WHERE acronym = $1', [dept.acronym]);
      const ministryId = ministryResult.rows[0]?.id || null;

      if (!ministryId) {
        console.warn(`⚠️ Skipping state department "${dept.name}" — Ministry "${dept.acronym}" not found.`);
        continue;
      }

      await query(
        `INSERT INTO state_departments
          (ministry_id, name, ps, location, website, email, phone, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO NOTHING`,
        [
          ministryId,
          dept.name,
          dept.ps || null,
          dept.location || null,
          dept.website || null,
          dept.email || null,
          dept.phone || null,
          'active'
        ]
      );
    }


    // 4. Insert Agencies under State Departments
    console.log('🏢 Seeding agencies...');
    
    const agenciesData = [
      // Agencies under State Department for Immigration and Citizen Services
      { state_dept: 'State Department for Immigration and Citizen Services', name: 'Directorate of Immigration Services', dg: 'Mr. Alexander K. Muteshi', acronym: 'DIS', location: 'Nyayo House, Nairobi', website: 'https://immigration.go.ke', email: 'info@immigration.go.ke', phone: '+254-20-2222022' },
      { state_dept: 'State Department for Immigration and Citizen Services', name: 'Department of Civil Registration Services', dg: 'Ms. Jane Mwangi', acronym: 'CRS', location: 'Sheria House, Nairobi', website: 'https://crs.go.ke', email: 'info@crs.go.ke', phone: '+254-20-2227416' },
      { state_dept: 'State Department for Immigration and Citizen Services', name: 'Integrated Population Registration Services', dg: 'Director', acronym: 'IPRS', location: 'Nairobi, Kenya', website: 'https://iprs.go.ke', email: 'info@iprs.go.ke', phone: '+254-20-2227417' },

      // Agencies under State Department for Internal Security and National Administration
      { state_dept: 'State Department for Internal Security and National Administration', name: 'National Police Service', dg: 'Inspector General of Police', acronym: 'NPS', location: 'Jogoo House, Nairobi', website: 'https://www.nationalpolice.go.ke', email: 'info@nationalpolice.go.ke', phone: '+254-20-341411' },
      { state_dept: 'State Department for Internal Security and National Administration', name: 'Directorate of Criminal Investigations', dg: 'Director of Criminal Investigations', acronym: 'DCI', location: 'Kiambu Road, Nairobi', website: 'https://www.dci.go.ke', email: 'info@dci.go.ke', phone: '+254-20-334211' },
      { state_dept: 'State Department for Internal Security and National Administration', name: 'National Intelligence Service', dg: 'Director General', acronym: 'NIS', location: 'NIS Headquarters, Nairobi', email: 'info@nis.go.ke', phone: '+254-20-2214111' },

      // Agencies under State Department for Medical Services
      { state_dept: 'State Department for Medical Services', name: 'Kenya Medical Supplies Authority', dg: 'Chief Executive Officer', acronym: 'KEMSA', location: 'Commercial Street, Nairobi', website: 'https://www.kemsa.co.ke', email: 'info@kemsa.co.ke', phone: '+254-20-2722527' },
      { state_dept: 'State Department for Medical Services', name: 'Kenyatta National Hospital', dg: 'Dr. Evanson Kamuri', acronym: 'KNH', location: 'Nairobi', website: 'https://knh.or.ke', email: 'info@knh.or.ke', phone: '+254-20-2726300' },
      { state_dept: 'State Department for Medical Services', name: 'Moi Teaching and Referral Hospital', dg: 'Dr. Wilson Aruasa', acronym: 'MTRH', location: 'Eldoret', website: 'https://mtrh.or.ke', email: 'info@mtrh.or.ke', phone: '+254-53-2033471' },

      // Agencies under State Department for Public Health and Professional Standards
      { state_dept: 'State Department for Public Health and Professional Standards', name: 'Kenya Medical Practitioners and Dentists Council', dg: 'Dr. Daniel Yumbya', acronym: 'KMPDC', location: 'Nairobi', website: 'https://kmpdc.go.ke', email: 'info@kmpdc.go.ke', phone: '+254-20-2724888' },
      { state_dept: 'State Department for Public Health and Professional Standards', name: 'Nursing Council of Kenya', dg: 'Registrar', acronym: 'NCK', location: 'Nairobi', website: null, email: null, phone: null },
      { state_dept: 'State Department for Public Health and Professional Standards', name: 'Pharmacy and Poisons Board', dg: 'Registrar', acronym: 'PPB', location: 'Nairobi', website: null, email: null, phone: null },

      // Agencies under State Department for National Treasury
      { state_dept: 'State Department for National Treasury', name: 'Kenya Revenue Authority', dg: 'Commissioner General', acronym: 'KRA', location: 'Times Tower, Nairobi', website: 'https://www.kra.go.ke', email: 'commissioner@kra.go.ke', phone: '+254-20-2810000' },
      { state_dept: 'State Department for National Treasury', name: 'Central Bank of Kenya', dg: 'Governor', acronym: 'CBK', location: 'Haile Selassie Avenue, Nairobi', website: 'https://www.centralbank.go.ke', email: 'communications@centralbank.go.ke', phone: '+254-20-2860000' },
      { state_dept: 'State Department for National Treasury', name: 'Insurance Regulatory Authority', dg: 'Godfrey Kiptum', acronym: 'IRA', location: 'Nairobi, Kenya', website: 'https://ira.go.ke', email: 'info@ira.go.ke', phone: '+254-20-4996000' },
      { state_dept: 'State Department for National Treasury', name: 'Kenya Deposit Insurance Corporation', dg: 'Mohamed Ahmed', acronym: 'KDIC', location: 'Nairobi, Kenya', website: 'https://kdic.go.ke', email: 'info@kdic.go.ke', phone: '+254-20-2218553' },

      // Agencies under State Department for Roads
      { state_dept: 'State Department for Roads', name: 'Kenya National Highways Authority', dg: 'Director General', acronym: 'KeNHA', location: 'Blue Shield Towers, Nairobi', website: 'https://www.kenha.co.ke', email: 'dg@kenha.co.ke', phone: '+254-20-2738000' },
      { state_dept: 'State Department for Roads', name: 'Kenya Urban Roads Authority', dg: 'Director General', acronym: 'KURA', location: 'IKM Place, Nairobi', website: 'https://www.kura.go.ke', email: 'info@kura.go.ke', phone: '+254-20-2726028' },
      { state_dept: 'State Department for Roads', name: 'Kenya Rural Roads Authority', dg: 'Director General', acronym: 'KeRRA', location: 'Barabara Plaza, Nairobi', website: 'https://www.kerra.go.ke', email: 'info@kerra.go.ke', phone: '+254-20-2723100' },

      // Agencies under State Department for Transport
      { state_dept: 'State Department for Transport', name: 'Kenya Civil Aviation Authority', dg: 'Emile Nguza Arao', acronym: 'KCAA', location: 'Nairobi, Kenya', website: 'https://kcaa.or.ke', email: 'info@kcaa.or.ke', phone: '+254-20-827470' },
      { state_dept: 'State Department for Transport', name: 'Kenya Ports Authority', dg: 'Managing Director', acronym: 'KPA', location: 'Mombasa', website: 'https://www.kpa.co.ke', email: 'info@kpa.co.ke', phone: '+254-41-2110999' },
      { state_dept: 'State Department for Transport', name: 'Kenya Railways Corporation', dg: 'Managing Director', acronym: 'KRC', location: 'Haile Selassie Avenue, Nairobi', website: 'https://www.krc.co.ke', email: 'info@krc.co.ke', phone: '+254-20-2219011' },

      // Agencies under State Department for ICT and the Digital Economy
      { state_dept: 'State Department for ICT and the Digital Economy', name: 'Kenya ICT Authority', dg: 'Director General', acronym: 'ICTA', location: 'Telposta Towers, Nairobi', website: 'https://www.icta.go.ke', email: 'info@icta.go.ke', phone: '+254-20-2211960' },
      { state_dept: 'State Department for ICT and the Digital Economy', name: 'Konza Technopolis Development Authority', dg: 'Chief Executive Officer', acronym: 'KoTDA', location: 'Konza City, Machakos', website: 'https://www.konza.go.ke', email: 'info@konza.go.ke', phone: '+254-20-2106000' },

      // Agencies under State Department for Agriculture
      { state_dept: 'State Department for Agriculture', name: 'Agriculture and Food Authority', dg: 'Director General', acronym: 'AFA', location: 'Kilimo House, Nairobi', website: 'https://www.afa.go.ke', email: 'info@afa.go.ke', phone: '+254-20-2718870' },
      { state_dept: 'State Department for Agriculture', name: 'Kenya Agricultural and Livestock Research Organization', dg: 'Director General', acronym: 'KALRO', location: 'Kaptagat Road, Nairobi', website: 'https://www.kalro.org', email: 'info@kalro.org', phone: '+254-20-3560555' },
      { state_dept: 'State Department for Agriculture', name: 'National Cereals and Produce Board', dg: 'Joseph Kimote', acronym: 'NCPB', location: 'Nairobi, Kenya', website: 'https://ncpb.co.ke', email: 'info@ncpb.co.ke', phone: '+254-20-3933000' },

      // Agencies under State Department for Livestock Development
      { state_dept: 'State Department for Livestock Development', name: 'Kenya Veterinary Board', dg: 'Registrar', acronym: 'KVB', location: 'Veterinary Research Labs, Nairobi', website: 'https://www.kvb.go.ke', email: 'info@kvb.go.ke', phone: '+254-20-3533169' },
      { state_dept: 'State Department for Livestock Development', name: 'Kenya Meat Commission', dg: 'Managing Commissioner', acronym: 'KMC', location: 'Athi River, Machakos', website: 'https://www.kmc.co.ke', email: 'info@kmc.co.ke', phone: '+254-45-6622001' },

      // Agencies under State Department for Higher Education and Research
      { state_dept: 'State Department for Higher Education and Research', name: 'Higher Education Loans Board', dg: 'Charles Ringera', acronym: 'HELB', location: 'Anniversary Towers, Nairobi', website: 'https://www.helb.co.ke', email: 'contactcentre@helb.co.ke', phone: '+254711052000' },
      { state_dept: 'State Department for Higher Education and Research', name: 'Commission for University Education', dg: 'Commission Secretary', acronym: 'CUE', location: 'Redhill Road, Nairobi', website: 'https://www.cue.or.ke', email: 'info@cue.or.ke', phone: '+254-20-7205000' },

      // Agencies under State Department for Basic Education
      { state_dept: 'State Department for Basic Education', name: 'Teachers Service Commission', dg: 'Chief Executive Officer', acronym: 'TSC', location: 'Upper Hill, Nairobi', website: 'https://www.tsc.go.ke', email: 'info@tsc.go.ke', phone: '+254-20-2892000' },
      { state_dept: 'State Department for Basic Education', name: 'Kenya National Examinations Council', dg: 'Dr. David Njengere', acronym: 'KNEC', location: 'Nairobi, Kenya', website: 'https://knec.ac.ke', email: 'info@knec.ac.ke', phone: '+254-20-2713874' },

      // Add more agencies as needed...
    ];

    for (const agency of agenciesData) {
      const deptResult = await query('SELECT id FROM state_departments WHERE name = $1', [agency.state_dept]);
      if (deptResult.rows[0]) {
        await query(
          `INSERT INTO agencies (state_department_id, name, director_general, acronym, location, website, email, phone) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (state_department_id, name) DO NOTHING`,
          [deptResult.rows[0].id, agency.name, agency.dg, agency.acronym, agency.location, agency.website, agency.email, agency.phone]
        );
      }
    }

        // 5. Insert System Users
    console.log('👥 Seeding system users...');
      const plainPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const systemUsers = [
      // Executive
      { email: 'president@president.go.ke', name: 'H.E. Dr. William Samoei Ruto', role: 'President',  phone: '+254-20-0000001', status: 'active' },
      { email: 'deputy.president@president.go.ke', name: 'H.E. Rigathi Gachagua', role: 'Deputy President', phone: '+254-20-0000002', status: 'active' },

      // Prime Cabinet Secretary
      { email: 'mudavadi@primecabinet.go.ke', name: 'Hon. Musalia Mudavadi', role: 'Prime Cabinet Secretary',  phone: '+254-20-3318880', status: 'active' },

      // Cabinet Secretariat
      { email: 'secretariat@cabinet.go.ke', name: 'Cabinet Secretariat', role: 'Cabinet Secretariat',  phone: '+254-20-2227410', status: 'active' },

      // Cabinet Secretaries
      { email: 'info@attorneygeneral.go.ke', name: 'Hon. Justin Muturi', role: 'Attorney General', phone: '+254-20-2222222', status: 'active' },
      
      { email: 'murkomen@interior.go.ke', name: 'Hon. Kipchumba Murkomen', role: 'Cabinet Secretary', phone: '+254-20-2227412', status: 'active' },
      { email: 'ndungu@treasury.go.ke', name: 'Hon. John Mbadi', role: 'Cabinet Secretary', phone: '+254-20-2252301', status: 'active' },
      { email: 'nakhumicha@health.go.ke', name: 'Hon. Susan Nakhumicha', role: 'Cabinet Secretary', phone: '+254-20-2717071', status: 'active' },
      { email: 'machogu@education.go.ke', name: 'Hon. Ezekiel Machogu', role: 'Cabinet Secretary', phone: '+254-20-3318581', status: 'active' },
      { email: 'owalo@ict.go.ke', name: 'Hon. Eliud Owalo', role: 'Cabinet Secretary', phone: '+254-20-2089063', status: 'active' },
      { email: 'duale@defence.go.ke', name: 'Hon. Aden Duale', role: 'Cabinet Secretary', phone: '+254-20-2726000', status: 'active' },
      { email: 'info@mod.go.ke', name: 'Hon. Aden Duale', role: 'Cabinet Secretary', phone: '+254-20-2726000', status: 'active' },
      { email: 'info@investment.go.ke', name: 'Hon. Rebecca Miano', role: 'Cabinet Secretary', phone: '+254-20-3318888', status: 'active' },
      { email: 'info@cooperatives.go.ke', name: 'Hon. Simon Chelugui', role: 'Cabinet Secretary', phone: '+254-20-2712801', status: 'active' },

      { email: 'info@transport.go.ke', name: 'Hon. Davis Chirchir', role: 'Cabinet Secretary', phone: '+254-20-2729200', status: 'active' },
      { email: 'info@lands.go.ke', name: 'Hon. Alice Wahome', role: 'Cabinet Secretary', phone: '+254-20-2718050', status: 'active' },
      { email: 'info@water.go.ke', name: 'Hon. Zachariah Njeru', role: 'Cabinet Secretary', phone: '+254-20-2716103', status: 'active' },
      { email: 'info@energy.go.ke', name: 'Hon. Opiyo Wandayi', role: 'Cabinet Secretary', phone: '+254-20-3101120', status: 'active' },

      { email: 'info@health.go.ke', name: 'Hon. Susan Nakhumicha', role: 'Cabinet Secretary', phone: '+254-20-2717077', status: 'active' },
      { email: 'info@education.go.ke', name: 'Hon. Ezekiel Machogu', role: 'Cabinet Secretary', phone: '+254-20-3318581', status: 'active' },
      { email: 'info@youth.go.ke', name: 'Hon. Ababu Namwamba', role: 'Cabinet Secretary', phone: '+254-20-2210941', status: 'active' },
      { email: 'info@labour.go.ke', name: 'Hon. Florence Bore', role: 'Cabinet Secretary', phone: '+254-20-2729800', status: 'active' },
      { email: 'info@gender.go.ke', name: 'Hon. Aisha Jumwa', role: 'Cabinet Secretary', phone: '+254-20-3742161', status: 'active' },

      // Production & Manufacturing Cluster
      { email: 'info@kilimo.go.ke', name: 'Hon. Mithika Linturi', role: 'Cabinet Secretary', phone: '+254-20-2718870', status: 'active' },
      { email: 'info@mining.go.ke', name: 'Hon. Salim Mvurya', role: 'Cabinet Secretary', phone: '+254-20-2723101', status: 'active' },

      // Environment & Natural Resources Cluster
      { email: 'info@environment.go.ke', name: 'Hon. Soipan Tuya', role: 'Cabinet Secretary', phone: '+254-20-2731571', status: 'active' },
      { email: 'info@tourism.go.ke', name: 'Hon. Alfred Mutua', role: 'Cabinet Secretary', phone: '+254-20-2711322', status: 'active' },

      // Regional Development Cluster
      { email: 'info@eac.go.ke', name: 'Hon. Peninah Malonza', role: 'Cabinet Secretary', phone: '+254-20-3318888', status: 'active' },

      // Principal Secretaries
      { email: 'omollo@interior.go.ke', name: 'Dr. Raymond Omollo', role: 'Principal Secretary', phone: '+254-20-2227413', status: 'inactive' },
      { email: 'muriuki@health.go.ke', name: 'Ms. Mary Muthoni Muriuki', role: 'Principal Secretary', phone: '+254-20-2717072', status: 'inactive' },
      { email: 'kipsang@education.go.ke', name: 'Dr. Belio Kipsang', role: 'Principal Secretary', phone: '+254-20-3318584', status: 'inactive' },

      // Technical Staff
      { email: 'director.cabinet@cabinet.go.ke', name: 'Director Cabinet Affairs', role: 'Director', phone: '+254-20-2227414', status: 'pending' },
      { email: 'assistant.director@cabinet.go.ke', name: 'Assistant Director Cabinet', role: 'Assistant Director', phone: '+254-20-2227415', status: 'pending' }
    ];


    for (const user of systemUsers) {
      await query(
      `INSERT INTO users (name, email, password, role, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, hashedPassword, user.role, user.status]
      );
    }

    // 6. Insert Cabinet Committees
    console.log('🏛️ Seeding cabinet committees...');
    const committees = [
      { name: 'Cabinet Committee on Governance and Security', cluster: 'Governance, Justice & Law & Order', chair: 'Deputy President', description: 'Oversees governance, justice and security matters' },
      { name: 'Cabinet Committee on Economic Affairs', cluster: 'Economic Affairs', chair: 'Deputy President', description: 'Oversees economic planning and development' },
      { name: 'Cabinet Committee on Infrastructure', cluster: 'Infrastructure', chair: 'Deputy President', description: 'Oversees infrastructure development projects' },
      { name: 'Cabinet Committee on Social Services', cluster: 'Social Services', chair: 'Deputy President', description: 'Oversees social services and welfare programs' },
      { name: 'Cabinet Committee on Production and Manufacturing', cluster: 'Production & Manufacturing', chair: 'Deputy President', description: 'Oversees production and manufacturing sectors' },
      { name: 'Cabinet Committee on Environment and Natural Resources', cluster: 'Environment & Natural Resources', chair: 'Deputy President', description: 'Oversees environment and natural resources management' },
      { name: 'Full Cabinet', cluster: null, chair: 'President', description: 'Full cabinet meeting chaired by the President' }
    ];

    for (const committee of committees) {
      let clusterId = null;
      if (committee.cluster) {
        const clusterResult = await query('SELECT id FROM clusters WHERE name = $1', [committee.cluster]);
        clusterId = clusterResult.rows[0]?.id;
      }

      await query(
        `INSERT INTO cabinet_committees (name, cluster_id, chair_title, description) 
         VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING`,
        [committee.name, clusterId, committee.chair, committee.description]
      );
    }

    // 7. Insert Sample Meetings
    console.log('📅 Seeding sample meetings...');
    const governanceCommittee = await query('SELECT id FROM cabinet_committees WHERE name = $1', ['Cabinet Committee on Governance and Security']);
    const deputyPresident = await query('SELECT id FROM users WHERE email = $1', ['deputy.president@president.go.ke']);

    if (governanceCommittee.rows[0] && deputyPresident.rows[0]) {
      await query(
        `INSERT INTO meetings (title, committee_id, meeting_type, scheduled_at, location, chair_id, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        ['Cabinet Committee on Governance and Security - Q1 2024', governanceCommittee.rows[0].id, 'cabinet_committee', '2024-03-15 09:00:00', 'State House, Nairobi', deputyPresident.rows[0].id, 'scheduled']
      );
    }

    const fullCabinet = await query('SELECT id FROM cabinet_committees WHERE name = $1', ['Full Cabinet']);
    const president = await query('SELECT id FROM users WHERE email = $1', ['president@president.go.ke']);

    if (fullCabinet.rows[0] && president.rows[0]) {
      await query(
        `INSERT INTO meetings (title, committee_id, meeting_type, scheduled_at, location, chair_id, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        ['Full Cabinet Meeting - March 2024', fullCabinet.rows[0].id, 'full_cabinet', '2024-03-20 10:00:00', 'State House, Nairobi', president.rows[0].id, 'scheduled']
      );
    }

    // ------------------------
    // SEED SAMPLE GOVERNMENT MEMOS
    // ------------------------
    console.log("📝 Seeding government memos...");

    const sampleMemos = [
      {
        title: "Digital Transformation in Public Service Delivery",
        summary:
          "Proposal to digitize key government services to enhance efficiency, transparency, and accessibility for citizens across all counties.",
        body: `The Ministry proposes a phased rollout of digital government platforms under eCitizen to integrate service delivery...`,
        memo_type: "cabinet",
        priority: "high",
        status: "submitted",
      },
      {
        title: "National Green Energy Transition Plan",
        summary:
          "A framework for Kenya’s transition to 100% renewable energy by 2035, focusing on solar, wind, and geothermal projects.",
        body: `The Ministry of Energy and Petroleum recommends policy alignment with Vision 2030 and the Paris Climate Agreement...`,
        memo_type: "committee",
        priority: "urgent",
        status: "under_review",
      },
      {
        title: "Review of Public Wage Bill and HR Rationalization",
        summary:
          "Proposes rationalization of human resource structures within ministries to optimize public expenditure.",
        body: `Following recommendations by the Salaries and Remuneration Commission (SRC)...`,
        memo_type: "cabinet",
        priority: "medium",
        status: "draft",
      },
      {
        title: "Infrastructure Partnership with Private Sector",
        summary:
          "Proposal for PPP framework to fund road construction and maintenance of critical infrastructure corridors.",
        body: `The Ministry of Roads and Transport proposes collaboration with the private sector through concession models...`,
        memo_type: "decision",
        priority: "high",
        status: "approved",
      },
      {
        title: "Enhancing Food Security through Smart Agriculture",
        summary:
          "Proposal to introduce precision agriculture and irrigation schemes in arid and semi-arid regions.",
        body: `This memo outlines the national plan to enhance productivity in ASAL areas...`,
        memo_type: "cabinet",
        priority: "urgent",
        status: "submitted",
      },
    ];

    // Get ministry and user IDs
    // const { rows: ministries } = await pool.query("SELECT id FROM ministries");
    const { rows: users } = await pool.query("SELECT id FROM users");

    // Safety check
    if (ministries.length > 0) {
      for (const memo of sampleMemos) {
        const randomMinistry =
          ministries[Math.floor(Math.random() * ministries.length)];
        const randomUser =
          users.length > 0
            ? users[Math.floor(Math.random() * users.length)].id
            : null;

        await pool.query(
          `INSERT INTO gov_memos
          (title, summary, body, memo_type, priority, status, submitting_ministry_id, created_by, submitted_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT DO NOTHING`,
          [
            memo.title,
            memo.summary,
            memo.body,
            memo.memo_type,
            memo.priority,
            memo.status,
            randomMinistry.id,
            randomUser,
          ]
        );
      }
      console.log("✅ Government memos seeded successfully.");
    } else {
      console.warn("⚠️ No ministries found — skipping memo seeding.");
    }

    console.log('✅ Initial data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};