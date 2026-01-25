import type { ColorSettings, UserSettings } from "./types.ts";

export const MCMETA_URL = "https://raw.githubusercontent.com/misode/mcmeta";
export const VANILLA_MCDOC_URL = "https://raw.githubusercontent.com/SpyglassMC/vanilla-mcdoc";

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
    primary: "#1b1b1b",
    text: "#dadada",
    add: "#487c13",
    remove: "#9b341b",
    selected: "#7f5505",
    warning: "#cca700",
    error: "#f48771",
    predicate: "#306163",
    function: "#5f5f5f",
    pool: "#386330"
};

export const DEFAULT_SETTINGS: UserSettings = {
    uiScale: 1,
    largeFileThreshold: 1000,
    colors: DEFAULT_COLOR_SETTINGS
};

export const DEFAULT_COLLAPSED_TYPES = new Set(["::java::data::worldgen::surface_rule::SurfaceRule"]);

export const CATEGORY_FROM_TYPE: Record<string, string> = {
    item_modifier: "function",
    predicate: "predicate"
};

export const SELECT_REGISTRIES = new Set([
    "block_predicate_type",
    "chunk_status",
    "consume_effect_type",
    "creative_mode_tab",
    "data_component_predicate_type",
    "data_component_type",
    "enchantment_effect_component_type",
    "enchantment_entity_effect_type",
    "enchantment_level_based_value_type",
    "enchantment_location_based_effect_type",
    "enchantment_provider_type",
    "enchantment_value_effect_type",
    "entity_sub_predicate_type",
    "float_provider_type",
    "height_provider_type",
    "int_provider_type",
    "item_sub_predicate_type",
    "loot_condition_type",
    "loot_function_type",
    "loot_nbt_provider_type",
    "loot_number_provider_type",
    "loot_pool_entry_type",
    "loot_score_provider_type",
    "number_format_type",
    "pos_rule_test",
    "position_source_type",
    "recipe_book_category",
    "recipe_display",
    "recipe_serializer",
    "recipe_type",
    "rule_block_entity_modifier",
    "rule_test",
    "slot_display",
    "stat_type",
    "trigger_type",
    "worldgen/biome_source",
    "worldgen/block_state_provider_type",
    "worldgen/carver",
    "worldgen/chunk_generator",
    "worldgen/density_function_type",
    "worldgen/feature",
    "worldgen/feature_size_type",
    "worldgen/foliage_placer_type",
    "worldgen/material_condition",
    "worldgen/material_rule",
    "worldgen/placement_modifier_type",
    "worldgen/pool_alias_binding",
    "worldgen/root_placer_type",
    "worldgen/structure_placement",
    "worldgen/structure_pool_element",
    "worldgen/structure_processor",
    "worldgen/structure_type",
    "worldgen/tree_decorator_type",
    "worldgen/trunk_placer_type"
]);
