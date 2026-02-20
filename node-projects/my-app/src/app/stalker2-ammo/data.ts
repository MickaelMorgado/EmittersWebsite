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
        compatibleWeapons: ['PM-M', 'Fort-12', 'Viper-5']
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
        compatibleWeapons: ['PM-M', 'Fort-12', 'Viper-5']
      }
    ]
  },
  {
    id: '9x19',
    name: '9x19mm',
    variants: [
      {
        id: '9x19_p',
        name: '9x19mm Para',
        type: 'Regular',
        weight: 0.009,
        damage: 4,
        penetration: 3,
        degradation: 1,
        description: 'Standard 9mm Parabellum round.',
        imageUrl: `${BASE_URL}stalker-2-9x19mm-p.png`,
        compatibleWeapons: ['Walker P9L', 'M-10', 'Viper-5 (Mod)']
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
        compatibleWeapons: ['Walker P9L', 'M-10']
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
        imageUrl: `${BASE_URL}stalker-2-45-acp-fmj.png`
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
        imageUrl: `${BASE_URL}stalker-2-45-acp-ap.png`
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
        imageUrl: `${BASE_URL}stalker-2-45-acp-hp.png`
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
        compatibleWeapons: ['AK-74', 'AKS-74U', 'Obokan']
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
        compatibleWeapons: ['AK-74', 'AKS-74U', 'Obokan']
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
        compatibleWeapons: ['AK-74', 'AKS-74U']
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
        compatibleWeapons: ['TRs 301', 'SGI-5k', 'GP 37', 'L85A2']
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
        compatibleWeapons: ['TRs 301', 'SGI-5k', 'GP 37']
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
        compatibleWeapons: ['TRs 301', 'L85A2']
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
        compatibleWeapons: ['TRs 301', 'SGI-5k', 'GP 37']
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
        imageUrl: `${BASE_URL}stalker-2-762x39mm-ps.png`
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
        imageUrl: `${BASE_URL}stalker-2-762x39mm-bz.png`
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
        imageUrl: `${BASE_URL}stalker-2-762x39mm-lan.png`
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
        compatibleWeapons: ['M701', 'Vintar-BC (Mod)']
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
        compatibleWeapons: ['M701']
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
        compatibleWeapons: ['M701']
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
        compatibleWeapons: ['SVD', 'SVU', 'PKP Pecheneg']
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
        compatibleWeapons: ['SVD', 'SVU']
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
        compatibleWeapons: ['SVD', 'SVU', 'PKP Pecheneg']
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
        imageUrl: `${BASE_URL}stalker-2-9x39mm-sp-5.png`
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
        imageUrl: `${BASE_URL}stalker-2-9x39mm-sp-6.png`
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
        imageUrl: `${BASE_URL}stalker-2-9x39mm-pa.png`
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
        imageUrl: `${BASE_URL}stalker-2-9x39mm-ppe.png`
      }
    ]
  },
  {
    id: '12x70',
    name: '12-gauge',
    variants: [
      {
        id: '12x70_buck',
        name: '12/70 Buckshot',
        type: 'Regular',
        weight: 0.045,
        damage: 9,
        penetration: 1,
        degradation: 2,
        description: 'Standard hunting shells.',
        imageUrl: `${BASE_URL}stalker-2-12x70mm-buckshot.png`,
        compatibleWeapons: ['D-10', 'Sawed-off', 'Chaser-13', 'SPSA-14']
      },
      {
        id: '12x70_slug',
        name: '12/70 Slug',
        type: 'Regular',
        weight: 0.045,
        damage: 8,
        penetration: 4,
        degradation: 4,
        description: 'Heavy lead slug.',
        imageUrl: `${BASE_URL}stalker-2-12x76mm-slug.png`,
        compatibleWeapons: ['D-10', 'Chaser-13', 'SPSA-14']
      },
      {
        id: '12x70_dart',
        name: '12/70 Dart',
        type: 'AP',
        weight: 0.045,
        damage: 7,
        penetration: 7,
        degradation: 6,
        description: 'Flash-stabilized dart projectile.',
        imageUrl: `${BASE_URL}stalker-2-12x76mm-expanding-dart.png`,
        compatibleWeapons: ['Chaser-13', 'SPSA-14']
      }
    ]
  },
  {
    id: '762x25',
    name: '7.62x25mm Tokarev',
    variants: [
      {
        id: '762x25_tt',
        name: '7.62x25mm Pst',
        type: 'Regular',
        weight: 0.010,
        damage: 5,
        penetration: 4,
        degradation: 2,
        description: 'Old but reliable pistol cartridge.',
        imageUrl: `${BASE_URL}stalker-2-762x25mm-pst.png`
      },
      {
        id: '762x25_ap',
        name: '7.62x25mm AP',
        type: 'AP',
        weight: 0.011,
        damage: 5,
        penetration: 6,
        degradation: 4,
        description: 'Hardened core for armored targets.',
        imageUrl: `${BASE_URL}stalker-2-762x25mm-ap.png`
      }
    ]
  },
  {
    id: '338_lapua',
    name: '.338 Lapua Magnum',
    variants: [
      {
        id: '338_regular',
        name: '.338 LM Regular',
        type: 'Regular',
        weight: 0.045,
        damage: 10,
        penetration: 8,
        degradation: 4,
        description: 'Extreme range precision round.',
        imageUrl: `${BASE_URL}stalker-2-338-lapua-regular.png`
      },
      {
        id: '338_ap',
        name: '.338 LM AP',
        type: 'AP',
        weight: 0.046,
        damage: 9,
        penetration: 11,
        degradation: 8,
        description: 'Anti-material precision round.',
        imageUrl: `${BASE_URL}stalker-2-338-lapua-ap.png`
      }
    ]
  },
  {
    id: '127x108',
    name: '12.7x108mm',
    variants: [
      {
        id: '127x108_regular',
        name: '12.7x108mm Regular',
        type: 'Regular',
        weight: 0.130,
        damage: 10,
        penetration: 10,
        degradation: 5,
        description: 'Heavy machine gun and sniper round.',
        imageUrl: `${BASE_URL}stalker-2-12-7mm-regular.png`
      },
      {
        id: '127x108_ap',
        name: '12.7x108mm AP',
        type: 'AP',
        weight: 0.135,
        damage: 10,
        penetration: 12,
        degradation: 9,
        description: 'Anti-tank and anti-material payload.',
        imageUrl: `${BASE_URL}stalker-2-12-7mm-ap.png`
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
        imageUrl: `${BASE_URL}stalker-2-gauss-cartridge.png`
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
        imageUrl: `${BASE_URL}stalker-2-vog-25.png`
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
        imageUrl: `${BASE_URL}stalker-2-pg-7v.png`
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
        imageUrl: `${BASE_URL}stalker-2-hedp.png`
      }
    ]
  }
];
