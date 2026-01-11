interface GeneratorConfig {
    id: string;
    url: string;
    wiki?: string;
    minVersion?: string;
    maxVersion?: string;
    noPath?: boolean;
    tags?: string[];
    path?: string;
    ext?: string;
    aliases?: string[];
}

const config = {
    generators: [
        {
            id: "loot_table",
            url: "loot-table",
            wiki: "https://minecraft.wiki/w/Loot_table"
        },
        {
            id: "predicate",
            url: "predicate",
            wiki: "https://minecraft.wiki/w/Predicate"
        },
        {
            id: "item_modifier",
            url: "item-modifier",
            minVersion: "1.17",
            wiki: "https://minecraft.wiki/w/Item_modifier"
        },
        {
            id: "advancement",
            url: "advancement",
            wiki: "https://minecraft.wiki/w/Custom_advancement"
        },
        {
            id: "recipe",
            url: "recipe",
            wiki: "https://minecraft.wiki/w/Recipe#JSON_format"
        },
        {
            id: "chat_type",
            url: "chat-type",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Chat_type"
        },
        {
            id: "damage_type",
            url: "damage-type",
            minVersion: "1.19.4",
            wiki: "https://minecraft.wiki/w/Damage_type"
        },
        {
            id: "trim_material",
            url: "trim-material",
            minVersion: "1.19.4"
        },
        {
            id: "trim_pattern",
            url: "trim-pattern",
            minVersion: "1.19.4"
        },
        {
            id: "banner_pattern",
            url: "banner-pattern",
            minVersion: "1.20.5",
            wiki: "https://minecraft.wiki/w/Banner/Patterns#JSON_Format"
        },
        {
            id: "wolf_variant",
            url: "wolf-variant",
            minVersion: "1.20.5",
            wiki: "https://minecraft.wiki/w/Mob_variant_definitions#Wolf"
        },
        {
            id: "wolf_sound_variant",
            url: "wolf-sound-variant",
            minVersion: "1.21.5"
        },
        {
            id: "enchantment",
            url: "enchantment",
            minVersion: "1.21",
            wiki: "https://minecraft.wiki/w/Custom_enchantment"
        },
        {
            id: "enchantment_provider",
            url: "enchantment-provider",
            minVersion: "1.21",
            wiki: "https://minecraft.wiki/w/Enchantment_provider"
        },
        {
            id: "painting_variant",
            url: "painting-variant",
            minVersion: "1.21",
            wiki: "https://minecraft.wiki/w/Painting_variant"
        },
        {
            id: "jukebox_song",
            url: "jukebox-song",
            minVersion: "1.21",
            wiki: "https://minecraft.wiki/w/Jukebox_song_definition"
        },
        {
            id: "instrument",
            url: "instrument",
            minVersion: "1.21.2",
            wiki: "https://minecraft.wiki/w/Instrument_definition"
        },
        {
            id: "trial_spawner",
            url: "trial-spawner",
            minVersion: "1.21.2",
            wiki: "https://minecraft.wiki/w/Trial_spawner_configuration"
        },
        {
            id: "pig_variant",
            url: "pig-variant",
            minVersion: "1.21.5",
            wiki: "https://minecraft.wiki/w/Mob_variant_definitions#Pig"
        },
        {
            id: "cat_variant",
            url: "cat-variant",
            minVersion: "1.21.5",
            wiki: "https://minecraft.wiki/w/Mob_variant_definitions#Cat"
        },
        {
            id: "frog_variant",
            url: "frog-variant",
            minVersion: "1.21.5",
            wiki: "https://minecraft.wiki/w/Mob_variant_definitions#Frog"
        },
        {
            id: "chicken_variant",
            url: "chicken-variant",
            minVersion: "1.21.5",
            wiki: "https://minecraft.wiki/w/Mob_variant_definitions#Chicken"
        },
        {
            id: "cow_variant",
            url: "cow-variant",
            minVersion: "1.21.5",
            wiki: "https://minecraft.wiki/w/Mob_variant_definitions#Cow"
        },
        {
            id: "dialog",
            url: "dialog",
            minVersion: "1.21.6",
            wiki: "https://minecraft.wiki/w/Dialog"
        },
        {
            id: "test_instance",
            url: "test-instance",
            minVersion: "1.21.5",
            wiki: "https://minecraft.wiki/w/Test_instance_definition"
        },
        {
            id: "test_environment",
            url: "test-environment",
            minVersion: "1.21.5",
            wiki: "https://minecraft.wiki/w/Test_environment_definition"
        },
        {
            id: "timeline",
            url: "timeline",
            minVersion: "1.21.11",
            wiki: "https://minecraft.wiki/w/Timeline"
        },
        {
            id: "zombie_nautilus_variant",
            url: "zombie-nautilus-variant",
            minVersion: "1.21.11"
        },
        {
            id: "villager_trade",
            url: "villager-trade",
            minVersion: "26.1",
            wiki: "https://minecraft.wiki/w/Villager_trade_definition"
        },
        {
            id: "trade_set",
            url: "trade-set",
            minVersion: "26.1"
        },
        {
            id: "text_component",
            url: "text-component",
            noPath: true,
            wiki: "https://minecraft.wiki/w/Raw_JSON_text_format#Java_Edition"
        },
        {
            id: "pack_mcmeta",
            url: "pack-mcmeta",
            wiki: "https://minecraft.wiki/w/Data_pack#pack.mcmeta"
        },
        {
            id: "dimension",
            url: "dimension",
            tags: ["worldgen"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Custom_dimension"
        },
        {
            id: "dimension_type",
            url: "dimension-type",
            tags: ["worldgen"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Dimension_type"
        },
        {
            id: "worldgen/biome",
            url: "worldgen/biome",
            tags: ["worldgen"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Custom_biome"
        },
        {
            id: "worldgen/configured_carver",
            url: "worldgen/carver",
            tags: ["worldgen"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Custom_carver"
        },
        {
            id: "worldgen/configured_feature",
            url: "worldgen/feature",
            tags: ["worldgen"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Configured_feature"
        },
        {
            id: "worldgen/placed_feature",
            url: "worldgen/placed-feature",
            tags: ["worldgen"],
            minVersion: "1.18",
            wiki: "https://minecraft.wiki/w/Placed_feature"
        },
        {
            id: "worldgen/density_function",
            url: "worldgen/density-function",
            tags: ["worldgen"],
            minVersion: "1.18.2",
            wiki: "https://minecraft.wiki/w/Density_function"
        },
        {
            id: "worldgen/noise",
            url: "worldgen/noise",
            tags: ["worldgen"],
            minVersion: "1.18",
            wiki: "https://minecraft.wiki/w/Noise"
        },
        {
            id: "worldgen/noise_settings",
            url: "worldgen/noise-settings",
            tags: ["worldgen"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Custom_noise_settings"
        },
        {
            id: "worldgen/configured_structure_feature",
            url: "worldgen/structure-feature",
            tags: ["worldgen"],
            minVersion: "1.16",
            maxVersion: "1.18.2"
        },
        {
            id: "worldgen/structure",
            url: "worldgen/structure",
            tags: ["worldgen"],
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Custom_structure"
        },
        {
            id: "worldgen/structure_set",
            url: "worldgen/structure-set",
            tags: ["worldgen"],
            minVersion: "1.18.2",
            wiki: "https://minecraft.wiki/w/Structure_set"
        },
        {
            id: "worldgen/configured_surface_builder",
            url: "worldgen/surface-builder",
            tags: ["worldgen"],
            minVersion: "1.16",
            maxVersion: "1.17",
            wiki: "https://minecraft.wiki/w/Configured_surface_builder"
        },
        {
            id: "worldgen/processor_list",
            url: "worldgen/processor-list",
            tags: ["worldgen"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Processor_list"
        },
        {
            id: "worldgen/template_pool",
            url: "worldgen/template-pool",
            tags: ["worldgen"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Template_pool"
        },
        {
            id: "worldgen/world_preset",
            url: "worldgen/world-preset",
            tags: ["worldgen"],
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Custom_world_preset"
        },
        {
            id: "worldgen/flat_level_generator_preset",
            url: "worldgen/flat-world-preset",
            tags: ["worldgen"],
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Custom_world_preset#Superflat_Level_Generation_Preset"
        },
        {
            id: "world",
            url: "world",
            noPath: true,
            tags: ["worldgen"],
            minVersion: "1.16",
            maxVersion: "1.19.3",
            wiki: "https://minecraft.wiki/w/Custom"
        },
        {
            id: "tag/block",
            url: "tags/block",
            tags: ["tags"],
            path: "tags/block",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/entity_type",
            url: "tags/entity-type",
            tags: ["tags"],
            path: "tags/entity_type",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/fluid",
            url: "tags/fluid",
            tags: ["tags"],
            path: "tags/fluid",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/game_event",
            url: "tags/game-event",
            tags: ["tags"],
            path: "tags/game_event",
            minVersion: "1.17",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/item",
            url: "tags/item",
            tags: ["tags"],
            path: "tags/item",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/damage_type",
            url: "tags/damage-type",
            tags: ["tags"],
            path: "tags/damage_type",
            minVersion: "1.19.4",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/dialog",
            url: "tags/dialog",
            tags: ["tags"],
            path: "tags/dialog",
            minVersion: "1.21.6",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/worldgen/biome",
            url: "tags/biome",
            tags: ["tags", "worldgen"],
            path: "tags/worldgen/biome",
            minVersion: "1.18.2",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/worldgen/structure",
            url: "tags/structure",
            tags: ["tags", "worldgen"],
            path: "tags/worldgen/structure",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/worldgen/structure_set",
            url: "tags/structure-set",
            tags: ["tags", "worldgen"],
            path: "tags/worldgen/structure_set",
            minVersion: "1.18.2",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/worldgen/flat_level_generator_preset",
            url: "tags/flat-world-preset",
            tags: ["tags", "worldgen"],
            path: "tags/worldgen/flat_level_generator_preset",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/worldgen/world_preset",
            url: "tags/world-preset",
            tags: ["tags", "worldgen"],
            path: "tags/worldgen/world_preset",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/banner_pattern",
            url: "tags/banner-pattern",
            tags: ["tags"],
            path: "tags/banner_pattern",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/cat_variant",
            url: "tags/cat-variant",
            tags: ["tags"],
            path: "tags/cat_variant",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/enchantment",
            url: "tags/enchantment",
            tags: ["tags"],
            path: "tags/enchantment",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/instrument",
            url: "tags/instrument",
            tags: ["tags"],
            path: "tags/instrument",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/painting_variant",
            url: "tags/painting-variant",
            tags: ["tags"],
            path: "tags/painting_variant",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/point_of_interest_type",
            url: "tags/point-of-interest-type",
            tags: ["tags"],
            path: "tags/point_of_interest_type",
            minVersion: "1.19",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/timeline",
            url: "tags/timeline",
            tags: ["tags"],
            path: "tags/timeline",
            minVersion: "1.21.11",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/zombie_nautilus_variant",
            url: "tags/zombie-nautilus-variant",
            tags: ["tags"],
            path: "tags/zombie_nautilus_variant",
            minVersion: "1.21.11",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/villager_trade",
            url: "tags/villager-trade",
            tags: ["tags"],
            path: "tags/villager_trade",
            minVersion: "26.1",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "tag/trade_set",
            url: "tags/trade-set",
            tags: ["tags"],
            path: "tags/trade_set",
            minVersion: "26.1",
            wiki: "https://minecraft.wiki/w/Tag_(Java_Edition)"
        },
        {
            id: "block_definition",
            url: "assets/blockstate",
            path: "blockstates",
            tags: ["assets"],
            wiki: "https://minecraft.wiki/w/Blockstates_definition"
        },
        {
            id: "item_definition",
            url: "assets/item",
            path: "items",
            tags: ["assets"],
            aliases: ["item model"],
            minVersion: "1.21.4",
            wiki: "https://minecraft.wiki/w/Items_model_definition"
        },
        {
            id: "model",
            url: "assets/model",
            path: "models",
            tags: ["assets"],
            wiki: "https://minecraft.wiki/w/Model#Item_models"
        },
        {
            id: "texture_meta",
            url: "assets/texture-meta",
            path: "textures",
            ext: ".png.mcmeta",
            tags: ["assets"],
            wiki: "https://minecraft.wiki/w/Resource_pack#Texture_animation"
        },
        {
            id: "equipment",
            url: "assets/equipment",
            path: "equipment",
            tags: ["assets"],
            minVersion: "1.21.4",
            wiki: "https://minecraft.wiki/w/Model#Equipment_models"
        },
        {
            id: "lang",
            url: "assets/lang",
            path: "lang",
            tags: ["assets"],
            wiki: "https://minecraft.wiki/w/Resource_pack#Language"
        },
        {
            id: "font",
            url: "assets/font",
            path: "font",
            tags: ["assets"],
            minVersion: "1.16",
            wiki: "https://minecraft.wiki/w/Resource_pack#Fonts"
        },
        {
            id: "atlas",
            url: "assets/atlas",
            path: "atlases",
            tags: ["assets"],
            minVersion: "1.19.3",
            wiki: "https://minecraft.wiki/w/Resource_pack#Atlases"
        },
        {
            id: "post_effect",
            url: "assets/post-effect",
            path: "post_effect",
            tags: ["assets"],
            minVersion: "1.21.2",
            wiki: "https://minecraft.wiki/w/Shader#Post-processing_effects"
        }
    ] as GeneratorConfig[]
};

export function getWikiUrl(resourceType: string | undefined): string | undefined {
    if (!resourceType) return undefined;
    const generator = config.generators.find((g) => g.id === resourceType);
    return generator?.wiki;
}

export function getWikiLabel(resourceType: string | undefined): string | undefined {
    if (!resourceType) return undefined;
    return resourceType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default config;
