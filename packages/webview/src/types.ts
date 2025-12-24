export type NodeKind = "string" | "number" | "boolean" | "enum" | "struct" | "list" | "union" | "reference";

export interface BaseNode {
    readonly kind: NodeKind;
    readonly key?: string;
    readonly optional?: boolean;
}

export interface StringNode extends BaseNode {
    readonly kind: "string";
    readonly value: string;
    readonly pattern?: string;
    readonly enum?: readonly string[];
}

export interface NumberNode extends BaseNode {
    readonly kind: "number";
    readonly value: number;
    readonly min?: number;
    readonly max?: number;
    readonly integer?: boolean;
}

export interface BooleanNode extends BaseNode {
    readonly kind: "boolean";
    readonly value: boolean;
}

export interface EnumNode extends BaseNode {
    readonly kind: "enum";
    readonly value: string;
    readonly options: readonly string[];
}

export interface StructNode extends BaseNode {
    readonly kind: "struct";
    readonly fields: readonly SchemaNode[];
}

export interface ListNode extends BaseNode {
    readonly kind: "list";
    readonly items: readonly SchemaNode[];
    readonly itemType: SchemaNode;
}

export interface UnionNode extends BaseNode {
    readonly kind: "union";
    readonly selected: number;
    readonly variants: readonly SchemaNode[];
}

export interface ReferenceNode extends BaseNode {
    readonly kind: "reference";
    readonly registry: string;
    readonly value: string;
}

export type SchemaNode = StringNode | NumberNode | BooleanNode | EnumNode | StructNode | ListNode | UnionNode | ReferenceNode;

export interface ExtensionMessage {
    readonly type: "init" | "schema" | "registries" | "file";
    readonly payload: unknown;
}

export interface InitPayload {
    readonly packFormat: number;
}
