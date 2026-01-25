import type { PackInfo as SharedPackInfo } from "@voxel/shared/types";
import type { Uri } from "vscode";

export interface PackInfo extends SharedPackInfo {
    readonly uri: Uri;
}

export type PackDetectionResult =
    | { readonly status: "found"; readonly pack: PackInfo }
    | { readonly status: "notFound" }
    | { readonly status: "invalid"; readonly uri: Uri; readonly reason: string };
