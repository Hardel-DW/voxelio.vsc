import type { CheckerContext, DocAndNode, FloatNode, ItemNode, LongNode } from "@spyglassmc/core";
import { Range } from "@spyglassmc/core";
import { dissectUri } from "@spyglassmc/java-edition/lib/binder/index.js";
import type { JsonNode, JsonPairNode } from "@spyglassmc/json";
import { JsonArrayNode, JsonFileNode, JsonObjectNode, JsonStringNode } from "@spyglassmc/json";
import { JsonStringOptions } from "@spyglassmc/json/lib/parser/string.js";
import type {
    Attributes,
    ListType,
    LiteralType,
    McdocType,
    NumericType,
    PrimitiveArrayType,
    TupleType,
    UnionType
} from "@spyglassmc/mcdoc";
import { NumericRange, RangeKind } from "@spyglassmc/mcdoc";
import type {
    McdocCheckerContext,
    SimplifiedMcdocType,
    SimplifiedMcdocTypeNoUnion,
    SimplifiedStructType,
    SimplifyValueNode
} from "@spyglassmc/mcdoc/lib/runtime/checker/index.js";
import { simplify } from "@spyglassmc/mcdoc/lib/runtime/checker/index.js";
import { CATEGORY_FROM_TYPE, DEFAULT_COLLAPSED_TYPES, SELECT_REGISTRIES } from "@voxel/shared/constants";
import type { McdocContext } from "@/services/McdocContext";
import type { SpyglassService } from "@/services/SpyglassService";
import { randomInt, randomSeed } from "@/services/Utils.ts";

export type SimplifiedMcdocField = SimplifiedStructType["fields"][number];
export interface NodeProps<T extends SimplifiedMcdocType = SimplifiedMcdocType> {
    type: T;
    node: JsonNode | undefined;
    ctx: McdocContext;
    optional?: boolean;
    excludeStrings?: string[];
}

export function getRootType(id: string): McdocType {
    if (id === "pack_mcmeta") {
        return { kind: "reference", path: "::java::pack::Pack" };
    }
    if (id === "text_component") {
        return { kind: "reference", path: "::java::util::text::Text" };
    }
    if (id.startsWith("tag/")) {
        return {
            kind: "concrete",
            child: { kind: "reference", path: "::java::data::tag::Tag" },
            typeArgs: [
                {
                    kind: "string",
                    attributes: [
                        {
                            name: "id",
                            value: {
                                kind: "tree",
                                values: {
                                    registry: { kind: "literal", value: { kind: "string", value: id.slice(4) } },
                                    tags: { kind: "literal", value: { kind: "string", value: "allowed" } }
                                }
                            }
                        }
                    ]
                }
            ]
        };
    }
    return {
        kind: "dispatcher",
        registry: "minecraft:resource",
        parallelIndices: [{ kind: "static", value: id }]
    };
}

export function getRootDefault(id: string, ctx: CheckerContext): JsonNode {
    const type = simplifyType(getRootType(id), ctx);
    return getDefault(type, Range.create(0), ctx);
}

export function getDefault(type: SimplifiedMcdocType, range: Range, ctx: CheckerContext): JsonNode {
    if (type.kind === "string") {
        return JsonStringNode.mock(range);
    }
    if (type.kind === "boolean") {
        return { type: "json:boolean", range, value: false };
    }
    if (isNumericType(type)) {
        return createNumericDefault(type, range);
    }
    if (type.kind === "struct" || type.kind === "any" || type.kind === "unsafe") {
        return createStructDefault(type, range, ctx);
    }
    if (isListOrArray(type)) {
        return createListDefault(type, range, ctx);
    }
    if (type.kind === "tuple") {
        return createTupleDefault(type, range, ctx);
    }
    if (type.kind === "union") {
        if (type.members.length === 0) {
            return { type: "json:null", range };
        }
        return getDefault(type.members[0], range, ctx);
    }
    if (type.kind === "enum") {
        const firstValue = type.values[0];
        return getDefault(
            { kind: "literal", value: { kind: type.enumKind ?? "string", value: firstValue.value } as LiteralType["value"] },
            range,
            ctx
        );
    }
    if (type.kind === "literal") {
        return createLiteralDefault(type, range);
    }
    return { type: "json:null", range };
}

// Misode: McdocHelpers.ts:52-88
function createNumericDefault(type: NumericType, range: Range): JsonNode {
    let num: number | bigint = 0;
    if (type.valueRange) {
        if (NumericRange.isInRange(type.valueRange, 0)) {
            num = 0;
        } else if (NumericRange.isInRange(type.valueRange, 1)) {
            num = 1;
        } else if (type.valueRange.min !== undefined && type.valueRange.min > 0) {
            num = type.valueRange.min;
            if (RangeKind.isLeftExclusive(type.valueRange.kind)) {
                num += 1;
            }
        }
    }
    // Misode: McdocHelpers.ts:76-83 - Handle @random attribute
    if (type.attributes?.some((a) => a.name === "random")) {
        num = type.kind === "long" ? randomSeed() : randomInt();
    }
    const value: LongNode | FloatNode =
        typeof num !== "number" || Number.isInteger(num)
            ? { type: "long", range, value: typeof num === "number" ? BigInt(num) : num }
            : { type: "float", range, value: num };
    return { type: "json:number", range, value, children: [value] };
}

function createStructDefault(type: SimplifiedMcdocType, range: Range, ctx: CheckerContext): JsonNode {
    const object = JsonObjectNode.mock(range);
    if (type.kind === "struct") {
        for (const field of type.fields) {
            if (field.kind !== "pair" || field.optional) continue;
            if (typeof field.key !== "string" && field.key.kind !== "literal") continue;

            const keyValue = typeof field.key === "string" ? field.key : String(field.key.value.value);
            const key: JsonStringNode = {
                type: "json:string",
                range,
                options: JsonStringOptions,
                value: keyValue,
                valueMap: [{ inner: Range.create(0), outer: Range.create(range.start) }]
            };
            const value = getDefault(simplifyType(field.type, ctx), range, ctx);
            const pair: JsonPairNode = { type: "pair", range, key, value, children: [key, value] };
            key.parent = pair;
            value.parent = pair;
            object.children.push(pair);
            pair.parent = object;
        }
    }
    return object;
}

function createListDefault(type: ListType | PrimitiveArrayType, range: Range, ctx: CheckerContext): JsonNode {
    const array = JsonArrayNode.mock(range);
    const minLength = type.lengthRange?.min ?? 0;
    for (let i = 0; i < minLength; i++) {
        const child = getDefault(simplifyType(getItemType(type), ctx), range, ctx);
        const itemNode: ItemNode<JsonNode> = { type: "item", range, children: [child], value: child };
        child.parent = itemNode;
        array.children.push(itemNode);
        itemNode.parent = array;
    }
    return array;
}

function createTupleDefault(type: TupleType, range: Range, ctx: CheckerContext): JsonNode {
    return {
        type: "json:array",
        range,
        children: type.items.map((item) => {
            const valueNode = getDefault(simplifyType(item, ctx), range, ctx);
            const itemNode: ItemNode<JsonNode> = { type: "item", range, children: [valueNode], value: valueNode };
            valueNode.parent = itemNode;
            return itemNode;
        })
    };
}

function createLiteralDefault(type: LiteralType, range: Range): JsonNode {
    if (type.value.kind === "string") {
        return {
            type: "json:string",
            range,
            options: JsonStringOptions,
            value: type.value.value,
            valueMap: [{ inner: Range.create(0), outer: Range.create(range.start) }]
        };
    }
    if (type.value.kind === "boolean") {
        return { type: "json:boolean", range, value: type.value.value };
    }
    const value: FloatNode | LongNode =
        type.value.kind === "float" || type.value.kind === "double"
            ? { type: "float", range, value: type.value.value }
            : { type: "long", range, value: BigInt(type.value.value) };
    return { type: "json:number", range, value, children: [value] };
}

export function getChange(
    type: SimplifiedMcdocTypeNoUnion,
    oldType: SimplifiedMcdocTypeNoUnion,
    oldNode: JsonNode,
    ctx: CheckerContext
): JsonNode {
    const node = getDefault(type, oldNode.range, ctx);

    // From X to [X]
    if (JsonArrayNode.is(node) && isListOrArray(type)) {
        const newItemType = simplifyType(getItemType(type), ctx);
        const possibleItemTypes = newItemType.kind === "union" ? newItemType.members : [newItemType];
        for (const possibleType of possibleItemTypes) {
            if (quickEqualTypes(oldType, possibleType)) {
                const newItem: ItemNode<JsonNode> = {
                    type: "item",
                    range: node.range,
                    children: [oldNode],
                    value: oldNode,
                    parent: node
                };
                oldNode.parent = newItem;
                node.children.splice(0, node.children.length, newItem);
                return node;
            }
        }
    }

    // From [X] to X
    if (JsonArrayNode.is(oldNode) && isListOrArray(oldType)) {
        const oldItemType = simplifyType(getItemType(oldType), ctx);
        if (oldItemType.kind !== "union" && quickEqualTypes(type, oldItemType)) {
            const oldItem = oldNode.children[0];
            if (oldItem?.value) {
                return oldItem.value;
            }
        }
    }

    // From X to {k: X}
    if (JsonObjectNode.is(node) && type.kind === "struct") {
        for (const field of type.fields) {
            if (field.optional || field.key.kind !== "literal") continue;
            const fieldType = simplifyType(field.type, ctx);
            if (fieldType.kind !== "union" && quickEqualTypes(fieldType, oldType)) {
                const keyStr = String(field.key.value.value);
                const index = node.children.findIndex((pair) => pair.key?.value === keyStr);
                if (index !== -1) {
                    node.children.splice(index, 1);
                }
                const key: JsonStringNode = {
                    type: "json:string",
                    range: node.range,
                    options: JsonStringOptions,
                    value: keyStr,
                    valueMap: [{ inner: Range.create(0), outer: Range.create(node.range.start) }]
                };
                const pair: JsonPairNode = { type: "pair", range: node.range, key, value: oldNode, children: [oldNode] };
                key.parent = pair;
                oldNode.parent = pair;
                node.children.push(pair);
                pair.parent = node;
                return node;
            }
        }
    }

    // From {k: X} to X
    if (JsonObjectNode.is(oldNode) && oldType.kind === "struct") {
        for (const oldField of oldType.fields) {
            if (oldField.key.kind !== "literal") continue;
            const oldFieldType = simplifyType(oldField.type, ctx);
            if (oldFieldType.kind !== "union" && quickEqualTypes(oldFieldType, type)) {
                const keyStr = String(oldField.key.value.value);
                const oldPair = oldNode.children.find((pair) => pair.key?.value === keyStr);
                if (oldPair?.value) {
                    return oldPair.value;
                }
            }
        }
    }

    return node;
}

interface SimplifyNodeContext {
    key?: JsonStringNode;
    parent?: JsonObjectNode;
}

export function simplifyType(type: McdocType, ctx: CheckerContext, nodeCtx: SimplifyNodeContext = {}): SimplifiedMcdocType {
    const { key, parent } = nodeCtx;
    const simplifyNode: SimplifyValueNode<JsonNode | undefined> = {
        entryNode: {
            parent: parent
                ? {
                      entryNode: { parent: undefined, runtimeKey: undefined },
                      node: { originalNode: parent, inferredType: inferType(parent) }
                  }
                : undefined,
            runtimeKey: key ? { originalNode: key, inferredType: inferType(key) } : undefined
        },
        node: { originalNode: undefined, inferredType: { kind: "any" } }
    };

    const context: McdocCheckerContext<JsonNode | undefined> = {
        ...ctx,
        allowMissingKeys: false,
        requireCanonical: false,
        isEquivalent: () => false,
        getChildren: (node) => {
            if (JsonObjectNode.is(node)) {
                return node.children
                    .filter((kvp) => kvp.key)
                    .map((kvp) => ({
                        key: { originalNode: kvp.key, inferredType: kvp.key ? inferType(kvp.key) : { kind: "any" as const } },
                        possibleValues: kvp.value ? [{ originalNode: kvp.value, inferredType: inferType(kvp.value) }] : []
                    }));
            }
            return [];
        },
        reportError: () => {},
        attachTypeInfo: () => {},
        nodeAttacher: () => {},
        stringAttacher: () => {}
    };

    const result = simplify(type, { node: simplifyNode, ctx: context });
    return result.typeDef;
}

function inferType(node: JsonNode): Exclude<McdocType, UnionType> {
    switch (node.type) {
        case "json:boolean":
            return { kind: "literal", value: { kind: "boolean", value: node.value ?? false } };
        case "json:number":
            return { kind: "literal", value: { kind: node.value.type, value: Number(node.value.value) } };
        case "json:null":
            return { kind: "any" };
        case "json:string":
            return { kind: "literal", value: { kind: "string", value: node.value } };
        case "json:array":
            return { kind: "list", item: { kind: "any" } };
        case "json:object":
            return { kind: "struct", fields: [] };
    }
}

export function isNumericType(type: McdocType): type is NumericType {
    return (
        type.kind === "byte" ||
        type.kind === "short" ||
        type.kind === "int" ||
        type.kind === "long" ||
        type.kind === "float" ||
        type.kind === "double"
    );
}

export function isListOrArray(type: McdocType): type is ListType | PrimitiveArrayType {
    return type.kind === "list" || type.kind === "byte_array" || type.kind === "int_array" || type.kind === "long_array";
}

export function getItemType(type: ListType | PrimitiveArrayType | TupleType, index?: number): McdocType {
    if (type.kind === "list") return type.item;
    if (type.kind === "byte_array") return { kind: "byte" };
    if (type.kind === "int_array") return { kind: "int" };
    if (type.kind === "long_array") return { kind: "long" };
    if (type.kind === "tuple") {
        return type.items[index ?? 0] ?? { kind: "any" };
    }
    return { kind: "any" };
}

export function isFixedList<T extends ListType | PrimitiveArrayType>(type: T): type is T & { lengthRange: { min: number } } {
    return type.lengthRange?.min !== undefined && type.lengthRange.min === type.lengthRange.max;
}

export function isInlineTuple(type: TupleType): boolean {
    return type.items.length <= 4 && type.items.every(isNumericType);
}

export function formatIdentifier(id: string, attributes?: Attributes): string {
    if (id.startsWith("!")) {
        return `! ${formatIdentifier(id.substring(1), attributes)}`;
    }
    const isStarred = attributes?.some((a) => a.name === "starred");
    const text = id
        .replace(/^minecraft:/, "")
        .replaceAll("_", " ")
        .replace(/[a-z][A-Z]+/g, (m) => `${m.charAt(0)} ${m.substring(1).toLowerCase()}`);
    return (isStarred ? "✨ " : "") + text.charAt(0).toUpperCase() + text.substring(1);
}

export function getCategory(type: McdocType): string | undefined {
    if (type.kind !== "reference" || !type.path) return undefined;
    switch (type.path) {
        case "::java::data::loot::LootPool":
        case "::java::data::worldgen::dimension::Dimension":
        case "::java::data::worldgen::surface_rule::SurfaceRule":
        case "::java::data::worldgen::template_pool::WeightedElement":
            return "pool";
        case "::java::data::loot::LootCondition":
        case "::java::data::advancement::AdvancementCriterion":
        case "::java::data::worldgen::dimension::biome_source::BiomeSource":
        case "::java::data::worldgen::processor_list::ProcessorRule":
        case "::java::data::worldgen::feature::placement::PlacementModifier":
            return "predicate";
        case "::java::data::loot::LootFunction":
        case "::java::data::worldgen::density_function::CubicSpline":
        case "::java::data::worldgen::processor_list::Processor":
            return "function";
        default:
            return undefined;
    }
}

export function isSelectRegistry(registry: string): boolean {
    return SELECT_REGISTRIES.has(registry);
}

// Misode: McdocRenderer.tsx:155-160
type StringType = Extract<SimplifiedMcdocType, { kind: "string" }>;
export function getIdRegistry(type: StringType): string | undefined {
    const idAttribute = type.attributes?.find((a) => a.name === "id")?.value;
    if (idAttribute?.kind === "literal" && idAttribute.value.kind === "string") {
        return idAttribute.value.value;
    }
    if (
        idAttribute?.kind === "tree" &&
        idAttribute.values.registry?.kind === "literal" &&
        idAttribute.values.registry.value.kind === "string"
    ) {
        return idAttribute.values.registry.value.value;
    }
    return undefined;
}

export function isDefaultCollapsedType(type: McdocType): boolean {
    return type.kind === "reference" && type.path !== undefined && DEFAULT_COLLAPSED_TYPES.has(type.path);
}

export function quickEqualTypes(a: SimplifiedMcdocTypeNoUnion, b: SimplifiedMcdocTypeNoUnion): boolean {
    if (a === b) return true;
    if (a.kind !== b.kind) return false;
    if (a.kind === "literal" && b.kind === "literal") {
        return a.value.kind === b.value.kind && a.value.value === b.value.value;
    }
    if (a.kind === "struct" && b.kind === "struct") {
        const keyA = a.fields[0]?.key;
        const keyB = b.fields[0]?.key;
        return (!keyA && !keyB) || (!!keyA && !!keyB && quickEqualTypes(keyA, keyB));
    }
    return true;
}

// Misode: McdocRenderer.tsx:445-457
export function selectUnionMember(
    type: SimplifiedMcdocType & { kind: "union" },
    node: JsonNode | undefined
): SimplifiedMcdocTypeNoUnion | undefined {
    const selectedType = (node as JsonNode & { typeDef?: SimplifiedMcdocType })?.typeDef;
    if (!selectedType || selectedType.kind === "any" || selectedType.kind === "unsafe") {
        return undefined;
    }

    if (selectedType.kind === "union") {
        return selectedType.members.find((m1) => type.members.find((m2) => quickEqualTypes(m1, m2)));
    }

    return selectedType;
}

export function getCategoryFromType(type: string | undefined): string | undefined {
    if (!type) return undefined;
    return CATEGORY_FROM_TYPE[type];
}

export function createMcdocContext(docAndNode: DocAndNode, service: SpyglassService, defaultCollapsed: boolean): McdocContext {
    const errors = [
        ...(docAndNode.node.binderErrors ?? []),
        ...(docAndNode.node.checkerErrors ?? []),
        ...(docAndNode.node.linterErrors ?? [])
    ];

    const checkerCtx = service.getCheckerContext(docAndNode.doc, errors);

    const makeEdit = (edit: (range: Range) => JsonNode | undefined): void => {
        service.applyEdit(docAndNode.doc.uri, (fileNode) => {
            const jsonFileNode = fileNode.children[0];
            if (JsonFileNode.is(jsonFileNode)) {
                const original = jsonFileNode.children[0] as JsonNode;
                const newNode = edit(original.range);
                if (newNode !== undefined) {
                    newNode.parent = fileNode;
                    fileNode.children[0] = newNode;
                }
            }
        });
    };

    return { ...checkerCtx, makeEdit, defaultCollapsed };
}

export function getResourceType(docAndNode: DocAndNode, ctx: McdocContext): string | undefined {
    if (docAndNode.doc.uri.endsWith("/pack.mcmeta")) {
        return "pack_mcmeta";
    }
    return dissectUri(docAndNode.doc.uri, ctx)?.category;
}

export function getMcdocType(resourceType: string | undefined, ctx: McdocContext) {
    if (!resourceType) return undefined;
    const rootType = getRootType(resourceType);
    const simplified = simplifyType(rootType, ctx);
    if (simplified.kind === "any" || simplified.kind === "unsafe") return undefined;
    return simplified;
}
