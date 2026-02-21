export interface AmmoVariant {
  id: string;
  name: string;
  type: 'Regular' | 'AP' | 'Expansive' | 'Match' | 'Iron' | 'Sniper' | 'Special';
  weight: number;
  damage: number;
  penetration: number;
  degradation: number;
  description: string;
  imageUrl?: string;
  compatibleWeapons?: string[];
  boxSize: number;
}

export interface AmmoCaliber {
  id: string;
  name: string;
  variants: AmmoVariant[];
}

const BASE_URL = 'https://stalker2.wiki.fextralife.com/file/Stalker-2/';

export const STALKER_AMMO_DATA: AmmoCaliber[] = [
  {
    id: '9x18',
    name: '9x18mm',
    variants: [
      {
        id: '9x18_pst',
        name: '9x18mm Pst',
        type: 'Regular',
        weight: 0.007,
        damage: 3,
        penetration: 2,
        degradation: 1,
        description: 'Standard 9x18mm pistol cartridge.',
        imageUrl: `${BASE_URL}stalker-2-9x18mm-pst.png`,
        compatibleWeapons: ['PM-M', 'Fort-12', 'Viper-5', "Skif's Pistol", 'PTM', 'APSB', 'Rat Killer', 'Encourage', 'Buket S-2', 'PTM Monolith', 'Spitter', 'Labyrinth IV'],
        boxSize: 20
      },
      {
        id: '9x18_rg028',
        name: '9x18mm RG028',
        type: 'AP',
        weight: 0.008,
        damage: 4,
        penetration: 5,
        degradation: 3,
        description: 'Improved armor penetration variant.',
        imageUrl: `${BASE_URL}stalker-2-9x18mm-rg028.png`,
        compatibleWeapons: ['PM-M', 'Fort-12', 'Viper-5', "Skif's Pistol", 'PTM', 'APSB', 'Rat Killer', 'Encourage', 'Buket S-2'],
        boxSize: 20
      }
    ]
  },
  {
    id: '9x19',
    name: '9x19mm',
    variants: [
      {
        id: '9x19_p',
        name: '9x19mm +P',
        type: 'Regular',
        weight: 0.009,
        damage: 4,
        penetration: 3,
        degradation: 1,
        description: 'Standard 9mm Parabellum round.',
        imageUrl: `${BASE_URL}stalker-2-9x19mm-p.png`,
        compatibleWeapons: ['Walker P9L', 'M-10', 'Viper-5 (Mod)', 'Riemann', 'Integral-A', 'Cavalier', 'Gambit', 'Zubr-19', "Shah's Mate", 'Model Competitor'],
        boxSize: 30
      },
      {
        id: '9x19_fmj',
        name: '9x19mm FMJ',
        type: 'Regular',
        weight: 0.009,
        damage: 4,
        penetration: 4,
        degradation: 2,
        description: 'Full Metal Jacket variant.',
        imageUrl: `${BASE_URL}stalker-2-9x19mm-fmj.png`,
        compatibleWeapons: ['Walker P9L', 'M-10', 'Riemann', 'Integral-A', 'Cavalier', 'Gambit', 'Zubr-19', "Shah's Mate"],
        boxSize: 30
      }
    ]
  },
  {
    id: '45acp',
    name: '.45 ACP',
    variants: [
      {
        id: '45acp_fmj',
        name: '.45 ACP FMJ',
        type: 'Regular',
        weight: 0.015,
        damage: 6,
        penetration: 2,
        degradation: 2,
        description: 'Standard .45 ACP round.',
        imageUrl: `${BASE_URL}stalker-2-45-acp-fmj.png`,
        boxSize: 20
      },
      {
        id: '45acp_ap',
        name: '.45 ACP AP',
        type: 'AP',
        weight: 0.016,
        damage: 5,
        penetration: 5,
        degradation: 5,
        description: 'Armor-piercing .45 ACP.',
        imageUrl: `${BASE_URL}stalker-2-45-acp-ap.png`,
        boxSize: 20
      },
      {
        id: '45acp_hp',
        name: '.45 ACP HP',
        type: 'Expansive',
        weight: 0.015,
        damage: 8,
        penetration: 1,
        degradation: 3,
        description: 'Hollow point for soft targets.',
        imageUrl: `${BASE_URL}stalker-2-45-acp-hp.png`,
        compatibleWeapons: ['M10 Gordon', 'UDP Compact', 'Kora-919', 'SIP-t M200', 'UDP Compact Monolith', 'Gangster'],
        boxSize: 20
      }
    ]
  },
  {
    id: '545x39',
    name: '5.45x39mm',
    variants: [
      {
        id: '545x39_ps',
        name: '5.45x39mm PS',
        type: 'Regular',
        weight: 0.011,
        damage: 5,
        penetration: 4,
        degradation: 2,
        description: 'Standard 5.45mm service round.',
        imageUrl: `${BASE_URL}stalker-2-545x39mm-ps.png`,
        compatibleWeapons: ['AK-74', 'AKS-74U', 'Obokan'],
        boxSize: 30
      },
      {
        id: '545x39_pp',
        name: '5.45x39mm PP',
        type: 'AP',
        weight: 0.012,
        damage: 5,
        penetration: 7,
        degradation: 5,
        description: 'Increased penetration variant.',
        imageUrl: `${BASE_URL}stalker-2-545x39mm-pp.png`,
        compatibleWeapons: ['AK-74', 'AKS-74U', 'Obokan'],
        boxSize: 30
      },
      {
        id: '545x39_mzhv',
        name: '5.45x39mm MZHV-13',
        type: 'Expansive',
        weight: 0.011,
        damage: 7,
        penetration: 3,
        degradation: 4,
        description: 'Expanding bullet for soft targets.',
        imageUrl: `${BASE_URL}stalker-2-545x39mm-mzhv-13.png`,
        compatibleWeapons: ['AK-74', 'AKS-74U', 'Abakan', 'AN-94', 'AKM-74U', 'AKM-74S', 'RPM-74', 'SA-U Gabion', 'Lullaby', 'Decider', 'Dnipro', 'Drowned', 'Spitfire', 'Sotnyk', "Valik Lummox's AKM-74S"],
        boxSize: 30
      }
    ]
  },
  {
    id: '556x45',
    name: '5.56x45mm',
    variants: [
      {
        id: '556x45_m885',
        name: '5.56x45mm M885',
        type: 'Regular',
        weight: 0.012,
        damage: 5,
        penetration: 5,
        degradation: 2,
        description: 'Standard NATO assault round.',
        imageUrl: `${BASE_URL}stalker-2-556x45mm-m885.png`,
        compatibleWeapons: ['TRs 301', 'SGI-5k', 'GP 37', 'L85A2', 'KHAROD', 'AR416', 'G36', 'Cluster****', 'AR416 Monolith', 'Combatant', 'Fora-221', 'SOFMOD', 'Merc', "Unknown Stalker's AR416"],
        boxSize: 30
      },
      {
        id: '556x45_m995',
        name: '5.56x45mm M995',
        type: 'AP',
        weight: 0.013,
        damage: 5,
        penetration: 8,
        degradation: 6,
        description: 'Tungsten core armor-piercing.',
        imageUrl: `${BASE_URL}stalker-2-556x45mm-m995.png`,
        compatibleWeapons: ['TRs 301', 'SGI-5k', 'GP 37'],
        boxSize: 30
      },
      {
        id: '556x45_hp',
        name: '5.56x45mm HP',
        type: 'Expansive',
        weight: 0.012,
        damage: 7,
        penetration: 2,
        degradation: 4,
        description: 'Hollow point variant.',
        imageUrl: `${BASE_URL}stalker-2-556x45mm-hp.png`,
        compatibleWeapons: ['TRs 301', 'L85A2'],
        boxSize: 30
      },
      {
        id: '556x45_mk262',
        name: '5.56x45mm Mk 262',
        type: 'Match',
        weight: 0.012,
        damage: 6,
        penetration: 6,
        degradation: 3,
        description: 'Precision match-grade round.',
        imageUrl: `${BASE_URL}stalker-2-556x45mm-mk-262.png`,
        compatibleWeapons: ['TRs 301', 'SGI-5k', 'GP 37'],
        boxSize: 30
      }
    ]
  },
  {
    id: '762x39',
    name: '7.62x39mm',
    variants: [
      {
        id: '762x39_ps',
        name: '7.62x39mm PS',
        type: 'Regular',
        weight: 0.016,
        damage: 7,
        penetration: 5,
        degradation: 2,
        description: 'Standard AK-47 round.',
        imageUrl: `${BASE_URL}stalker-2-762x39mm-ps.png`,
        compatibleWeapons: ['KHAROD', 'AKM-74', 'SKS', 'Glutton', 'AKM'],
        boxSize: 30
      },
      {
        id: '762x39_bz',
        name: '7.62x39mm BZ',
        type: 'AP',
        weight: 0.017,
        damage: 6,
        penetration: 8,
        degradation: 6,
        description: 'Armor-piercing incendiary variant.',
        imageUrl: `${BASE_URL}stalker-2-762x39mm-bz.png`,
        boxSize: 30
      },
      {
        id: '762x39_lan',
        name: '7.62x39mm Lancaster',
        type: 'Special',
        weight: 0.016,
        damage: 8,
        penetration: 4,
        degradation: 4,
        description: 'Specialized hunting round.',
        imageUrl: `${BASE_URL}stalker-2-762x39mm-lan.png`,
        compatibleWeapons: ['KHAROD', 'AKM-74', 'SKS', 'ASh-12'],
        boxSize: 30
      }
    ]
  },
  {
    id: '762x51',
    name: '.308',
    variants: [
      {
        id: '762x51_w',
        name: '.308 W',
        type: 'Regular',
        weight: 0.024,
        damage: 8,
        penetration: 7,
        degradation: 3,
        description: 'Standard Western rifle round.',
        imageUrl: `${BASE_URL}stalker-2-308-w.png`,
        compatibleWeapons: ['M701', 'Vintar-BC (Mod)'],
        boxSize: 20
      },
      {
        id: '762x51_ap',
        name: '.308 AP',
        type: 'AP',
        weight: 0.025,
        damage: 7,
        penetration: 9,
        degradation: 7,
        description: 'High-penetration sniper round.',
        imageUrl: `${BASE_URL}stalker-2-308-ap.png`,
        compatibleWeapons: ['M701'],
        boxSize: 20
      },
      {
        id: '762x51_match',
        name: '.308 MATCH',
        type: 'Match',
        weight: 0.024,
        damage: 9,
        penetration: 6,
        degradation: 4,
        description: 'Precision match-grade variant.',
        imageUrl: `${BASE_URL}stalker-2-308-match.png`,
        compatibleWeapons: ['M701', 'Partner', 'M701 Super', 'Trophy', 'Hunter', 'Deadeye', 'Beast', 'Mark I EMR'],
        boxSize: 20
      }
    ]
  },
  {
    id: '762x54',
    name: '7.62x54mm',
    variants: [
      {
        id: '762x54_lps',
        name: '7.62x54mm LPS',
        type: 'Regular',
        weight: 0.023,
        damage: 8,
        penetration: 7,
        degradation: 3,
        description: 'Light steel core projectile.',
        imageUrl: `${BASE_URL}stalker-2-762x54mm-lps.png`,
        compatibleWeapons: ['SVD', 'SVU', 'PKP Pecheneg', 'SVDM-2', 'SVDM-2 (Lynx)', 'SVU-MK S-3', 'Whip'],
        boxSize: 10
      },
      {
        id: '762x54_7n1',
        name: '7.62x54mm 7N1',
        type: 'Sniper',
        weight: 0.023,
        damage: 9,
        penetration: 8,
        degradation: 4,
        description: 'Special sniper-grade payload.',
        imageUrl: `${BASE_URL}stalker-2-762x54mm-7n1.png`,
        compatibleWeapons: ['SVD', 'SVU', 'SVDM-2', 'SVDM-2 (Lynx)'],
        boxSize: 10
      },
      {
        id: '762x54_b32',
        name: '7.62x54mm B-32',
        type: 'AP',
        weight: 0.024,
        damage: 8,
        penetration: 10,
        degradation: 7,
        description: 'Armor-piercing incendiary bullet.',
        imageUrl: `${BASE_URL}stalker-2-762x54mm-b-32.png`,
        compatibleWeapons: ['SVD', 'SVU', 'PKP Pecheneg', 'SVDM-2', 'SVDM-2 (Lynx)'],
        boxSize: 10
      }
    ]
  },
  {
    id: '9x39',
    name: '9x39mm',
    variants: [
      {
        id: '9x39_sp5',
        name: '9x39mm SP-5',
        type: 'Regular',
        weight: 0.022,
        damage: 7,
        penetration: 6,
        degradation: 2,
        description: 'Standard subsonic special sniper round.',
        imageUrl: `${BASE_URL}stalker-2-9x39mm-sp-5.png`,
        compatibleWeapons: ['VS Vintar', 'AS Lavina', 'Vintar', 'SA Avalanche', 'Grom S-14', 'AS Val', 'VSS Vintorez'],
        boxSize: 20
      },
      {
        id: '9x39_sp6',
        name: '9x39mm SP-6',
        type: 'AP',
        weight: 0.022,
        damage: 7,
        penetration: 8,
        degradation: 5,
        description: 'Armor-piercing subsonic round.',
        imageUrl: `${BASE_URL}stalker-2-9x39mm-sp-6.png`,
        boxSize: 20
      },
      {
        id: '9x39_pa',
        name: '9x39mm PAB-9',
        type: 'AP',
        weight: 0.023,
        damage: 8,
        penetration: 7,
        degradation: 7,
        description: 'Economical armor-piercing variant.',
        imageUrl: `${BASE_URL}stalker-2-9x39mm-pa.png`,
        boxSize: 20
      },
      {
        id: '9x39_ppe',
        name: '9x39mm PPE',
        type: 'Expansive',
        weight: 0.022,
        damage: 9,
        penetration: 4,
        degradation: 4,
        description: 'Expanding sub-sonic bullet.',
        imageUrl: `${BASE_URL}stalker-2-9x39mm-ppe.png`,
        compatibleWeapons: ['Vintar', 'SA Avalanche', 'AS Val', 'VSS Vintorez'],
        boxSize: 20
      }
    ]
  },
  {
    id: '12x70',
    name: '12-gauge',
    variants: [
      {
        id: '12x70_buck',
        name: '12x70 Buckshot',
        type: 'Regular',
        weight: 0.045,
        damage: 9,
        penetration: 1,
        degradation: 2,
        description: 'Standard hunting shells.',
        imageUrl: `${BASE_URL}stalker-2-12x70mm-buckshot.png`,
        compatibleWeapons: ['D-10', 'Sawed-off', 'Chaser-13', 'SPSA-14', 'SledgeHammer', 'TOZ-34', 'Boomstick', 'M860 Cracker', 'M860 Monolith', 'Margach D-12MT', 'Predator', 'Ram-2', 'Saiga D-12', 'Texan', 'Drowned'],
        boxSize: 10
      },
      {
        id: '12x76_slug',
        name: '12x76 Slug',
        type: 'Regular',
        weight: 0.045,
        damage: 8,
        penetration: 4,
        degradation: 4,
        description: 'Heavy lead slug.',
        imageUrl: `${BASE_URL}stalker-2-12x76mm-slug.png`,
        compatibleWeapons: ['D-10', 'Sawed-off', 'Chaser-13', 'SPSA-14', 'SledgeHammer', 'TOZ-34', 'Boomstick', 'M860 Cracker', 'M860 Monolith', 'Margach D-12MT', 'Predator', 'Ram-2', 'Saiga D-12', 'Texan', 'Drowned'],
        boxSize: 10
      },
      {
        id: '12x76_dart',
        name: '12x76 Dart',
        type: 'AP',
        weight: 0.045,
        damage: 7,
        penetration: 7,
        degradation: 6,
        description: 'Flash-stabilized dart projectile.',
        imageUrl: `${BASE_URL}stalker-2-12x76mm-expanding-dart.png`,
        compatibleWeapons: ['D-10', 'Sawed-off', 'Chaser-13', 'SPSA-14', 'SledgeHammer', 'TOZ-34', 'Boomstick', 'M860 Cracker', 'M860 Monolith', 'Margach D-12MT', 'Predator', 'Ram-2', 'Saiga D-12', 'Texan', 'Drowned'],
        boxSize: 10
      }
    ]
  },
  {
    id: '12-7x55',
    name: '12.7x55mm',
    variants: [
      {
        id: '12_7x55_ps',
        name: '12.7x55mm PS-12',
        type: 'Regular',
        weight: 0.045,
        damage: 10,
        penetration: 8,
        degradation: 6,
        description: 'Heavy subsonic assault round.',
        imageUrl: `${BASE_URL}stalker-2-12_7x55mm-ps-12.png`,
        compatibleWeapons: ['ASh-12'],
        boxSize: 10
      }
    ]
  },
  {
    id: '338_lapua',
    name: '.338 Lapua',
    variants: [
      {
        id: '338_lapua_m',
        name: '.338 Lapua Magnum',
        type: 'Sniper',
        weight: 0.055,
        damage: 10,
        penetration: 10,
        degradation: 8,
        description: 'High-precision long-range projectile.',
        imageUrl: `${BASE_URL}stalker-2-338-lapua-magnum.png`,
        compatibleWeapons: ['M701'],
        boxSize: 5
      }
    ]
  },
  {
    id: '762x25',
    name: '7.62x25mm',
    variants: [
      {
        id: '762x25_p',
        name: '7.62x25mm P',
        type: 'Regular',
        weight: 0.010,
        damage: 4,
        penetration: 3,
        degradation: 1,
        description: 'Standard Tokarev service round.',
        imageUrl: `${BASE_URL}stalker-2-762x25mm-p.png`,
        boxSize: 20
      }
    ]
  },
  {
    id: 'special',
    name: 'Specialist Hardware',
    variants: [
      {
        id: 'gauss',
        name: 'Gauss Cartridge',
        type: 'Special',
        weight: 0.050,
        damage: 10,
        penetration: 10,
        degradation: 5,
        description: 'Electromagnetic accelerator payload.',
        imageUrl: `${BASE_URL}stalker-2-gauss-cartridge.png`,
        compatibleWeapons: ['Gauss Rifle', 'Piorun', 'Gauss Gun', 'EM-1'],
        boxSize: 10
      },
      {
        id: 'vog25',
        name: 'VOG-25',
        type: 'Special',
        weight: 0.250,
        damage: 9,
        penetration: 4,
        degradation: 3,
        description: 'Under-barrel grenade launcher round.',
        imageUrl: `${BASE_URL}stalker-2-vog-25.png`,
        boxSize: 1
      },
      {
        id: 'pg7v',
        name: 'PG-7V',
        type: 'Special',
        weight: 0.500,
        damage: 10,
        penetration: 8,
        degradation: 5,
        description: 'Anti-tank rocket projectile.',
        imageUrl: `${BASE_URL}stalker-2-pg-7v.png`,
        compatibleWeapons: ['RPG-7', 'RPG-7U'],
        boxSize: 1
      },
      {
        id: 'hedp',
        name: 'M433 HEDP',
        type: 'Special',
        weight: 0.300,
        damage: 10,
        penetration: 6,
        degradation: 4,
        description: 'High Explosive Dual Purpose grenade.',
        imageUrl: `${BASE_URL}stalker-2-hedp.png`,
        boxSize: 1
      }
    ]
  }
];
