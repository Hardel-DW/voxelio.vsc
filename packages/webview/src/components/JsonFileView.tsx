import type { DocAndNode, Range } from "@spyglassmc/core";
import { dissectUri } from "@spyglassmc/java-edition/lib/binder/index.js";
import type { JsonNode } from "@spyglassmc/json";
import { JsonFileNode } from "@spyglassmc/json";
import type { JSX } from "preact";
import type { McdocContext } from "@/services/McdocContext.ts";
import { getRootType, simplifyType } from "@/services/McdocHelpers.ts";
import type { SpyglassService } from "@/services/SpyglassService.ts";
import { McdocRoot } from "./mcdoc/McdocRoot.tsx";

interface JsonFileViewProps {
    docAndNode: DocAndNode;
    service: SpyglassService;
}

export function JsonFileView({ docAndNode, service }: JsonFileViewProps): JSX.Element | null {
    const jsonFile = docAndNode.node.children[0];
    if (!JsonFileNode.is(jsonFile)) {
        return <div class="error-message">Invalid JSON file structure</div>;
    }

    const node = jsonFile.children[0] as JsonNode | undefined;
    const ctx = createMcdocContext(docAndNode, service);
    const resourceType = getResourceType(docAndNode, ctx);
    const mcdocType = getMcdocType(resourceType, ctx);

    if (!mcdocType) {
        return <div class="error-message">Unknown resource type: {resourceType ?? "none"}</div>;
    }

    return (
        <div class="file-view node-root" data-category={getCategoryFromType(resourceType)}>
            <McdocRoot type={mcdocType} node={node} ctx={ctx} />
        </div>
    );
}

function createMcdocContext(docAndNode: DocAndNode, service: SpyglassService): McdocContext {
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

    return { ...checkerCtx, makeEdit };
}

function getResourceType(docAndNode: DocAndNode, ctx: McdocContext): string | undefined {
    if (docAndNode.doc.uri.endsWith("/pack.mcmeta")) {
        return "pack_mcmeta";
    }
    const res = dissectUri(docAndNode.doc.uri, ctx);
    return res?.category;
}

function getMcdocType(resourceType: string | undefined, ctx: McdocContext) {
    if (!resourceType) return undefined;
    const rootType = getRootType(resourceType);
    return simplifyType(rootType, ctx);
}

function getCategoryFromType(type: string | undefined): string | undefined {
    switch (type) {
        case "item_modifier":
            return "function";
        case "predicate":
            return "predicate";
        default:
            return undefined;
    }
}
