import type { DocAndNode } from "@spyglassmc/core";
import type { JsonNode } from "@spyglassmc/json";
import { JsonFileNode } from "@spyglassmc/json";
import type { JSX } from "preact";
import { McdocRoot } from "@/components/mcdoc/McdocRoot.tsx";
import { createMcdocContext, getCategoryFromType, getMcdocType, getResourceType } from "@/services/McdocHelpers.ts";
import type { SpyglassService } from "@/services/SpyglassService.ts";

interface JsonFileViewProps {
    docAndNode: DocAndNode;
    service: SpyglassService;
    largeFileThreshold: number;
}

export function JsonFileView({ docAndNode, service, largeFileThreshold }: JsonFileViewProps): JSX.Element | null {
    const jsonFile = docAndNode.node.children[0];
    if (!JsonFileNode.is(jsonFile)) {
        return <div class="error-message">Invalid JSON file structure</div>;
    }

    const node = jsonFile.children[0] as JsonNode | undefined;
    const lineCount = docAndNode.doc.getText().split("\n").length;
    const isLargeFile = largeFileThreshold > 0 && lineCount > largeFileThreshold;
    const ctx = createMcdocContext(docAndNode, service, isLargeFile);
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
