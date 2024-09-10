
interface JobData {
    categoryname?: string;
    name: string;
    level: number;
    experience: { currentExp: number; expToNextLevel: number; } | null;
}

enum ClassJob {
    // TANK
    PALADIN, WARRIOR, DARK_KNIGHT, GUNBREAKER,
    TANK_PALADIN, TANK_WARRIOR, TANK_DARK_KNIGHT, TANK_GUNBREAKER,

    // HEALER
    WHITE_MAGE, SCHOLAR, ASTROLOGIAN, SAGE,
    HEALER_WHITE_MAGE, HEALER_SCHOLAR, HEALER_ASTROLOGIAN, HEALER_SAGE,

    // MELEE_DPS
    MONK, DRAGOON, NINJA, SAMURAI, REAPER, VIPER,
    MELEE_DPS_MONK, MELEE_DPS_DRAGOON, MELEE_DPS_NINJA, MELEE_DPS_SAMURAI, MELEE_DPS_REAPER, MELEE_DPS_VIPER,

    // PHYSICAL_RANGED_DPS
    BARD, MACHINIST, DANCER,
    PHYSICAL_RANGED_DPS_BARD, PHYSICAL_RANGED_DPS_MACHINIST, PHYSICAL_RANGED_DPS_DANCER,

    // MAGICAL_RANGED_DPS
    BLACK_MAGE, SUMMONER, RED_MAGE, PICTOMANCER, BLUE_MAGE,
    MAGICAL_RANGED_DPS_BLACK_MAGE, MAGICAL_RANGED_DPS_SUMMONER, MAGICAL_RANGED_DPS_RED_MAGE, MAGICAL_RANGED_DPS_PICTOMANCER, MAGICAL_RANGED_DPS_BLUE_MAGE,

    // DISCIPLE_OF_THE_HAND
    CARPENTER, BLACKSMITH, ARMORER, GOLDSMITH, LEATHERWORKER, WEAVER, ALCHEMIST, CULINARIAN,
    DISCIPLE_OF_THE_HAND_CARPENTER, DISCIPLE_OF_THE_HAND_BLACKSMITH, DISCIPLE_OF_THE_HAND_ARMORER, DISCIPLE_OF_THE_HAND_GOLDSMITH, DISCIPLE_OF_THE_HAND_LEATHERWORKER, DISCIPLE_OF_THE_HAND_WEAVER, DISCIPLE_OF_THE_HAND_ALCHEMIST, DISCIPLE_OF_THE_HAND_CULINARIAN,

    // DISCIPLE_OF_THE_LAND
    MINER, BOTANIST, FISHER,
    DISCIPLE_OF_THE_LAND_MINER, DISCIPLE_OF_THE_LAND_BOTANIST, DISCIPLE_OF_THE_LAND_FISHER,

    //special
    BOZJAN,EUREKA
}

interface Experience {
    currentExp: number;
    expToNextLevel: number;
}

interface ClassJobLevel {
    level: number | string;
    experience: Experience | null;
    categoryname?: string;
    jobname?: string;
}

interface ClassLevel {
    unlockState: ClassJob;
    level: number | string;
    experience: Experience | null;
}

enum Race {
    Hyur,
    Elezen,
    Lalafell,
    Miqote,
    Roegadyn,
    AuRa,
    Viera,
    Hrothgar
}

enum Clan {
    // Hyur
    Midlander,
    Highlander,
    // Elezen
    Wildwood,
    Duskwight,
    // Lalafell
    Plainsfolk,
    Dunesfolk,
    // Miqo'te
    SeekerOfTheSun,
    KeeperOfTheMoon,
    // Roegadyn
    SeaWolf,
    Hellsguard,
    // Au Ra
    Raen,
    Xaela,
    // Viera
    Rava,
    Veena,
    // Hrothgar
    Helion,
    Lost
}

interface CharacterInfo {
    name: string;
    server: string;
    title?: string;
    race: Race;
    clan: Clan;
    gender: string;
    level: string;
    jobName: string;
    jobIcon: string;
    portrait: string;
    freeCompany?: {
        name: string;
        id: string;
    };
    grandCompany?: {
        name: string;
        rank: string;
    };
    nameday: string;
    guardian: string;
    cityState: string;
    linkshells: string[];
    crossWorldLinkshells: string[];
    classLevels: Partial<Record<ClassJob, ClassJobLevel & { categoryname?: string; jobname?: string }>>;
    bio: string;
    activeClassJob: string;
    activeClassJobLevel: string;
    jobIconUrl: string;
    avatar: string;
    guardianDeity: {
        name: string;
        icon: string;
    };
    pvpTeam?: {
        name: string;
        id: string;
    };
    bozja?: {
        level: string;
        mettle: string;
        name: string;
    };
    eureka?: {
        level: string;
        exp: string;
        name: string;
    };
    parsedClassJobIcon: string;
}

type JobIconMapping = {
    [key: string]: string;
};

export {
    JobData,
    ClassJob,
    Experience,
    ClassJobLevel,
    ClassLevel,
    Race,
    Clan,
    CharacterInfo,
    JobIconMapping
};
