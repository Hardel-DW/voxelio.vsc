import { JsonFileView } from "@/components/JsonFileView.tsx";
import { useExtensionMessages } from "@/hooks/useExtensionMessages.ts";
import { useEditorStore } from "@/stores/editor.ts";
import { useFileStore } from "@/stores/file.ts";
import { useSpyglassStore } from "@/stores/spyglass.ts";

export function App(): React.ReactNode {
    useExtensionMessages();

    const packFormat = useEditorStore((s) => s.packFormat);
    const version = useEditorStore((s) => s.version);
    const loading = useSpyglassStore((s) => s.loading);
    const error = useSpyglassStore((s) => s.error);
    const service = useSpyglassStore((s) => s.service);
    const docAndNode = useFileStore((s) => s.docAndNode);

    if (error) {
        return <div className="p-4 text-red-400">Error: {error}</div>;
    }

    if (loading) {
        return <div className="p-4 text-gray-400">Loading Spyglass...</div>;
    }

    if (!packFormat || !version) {
        return <div className="p-4 text-gray-400">Waiting for pack info...</div>;
    }

    if (!service) {
        return <div className="p-4 text-gray-400">Initializing Spyglass...</div>;
    }

    if (!docAndNode) {
        return (
            <div className="flex flex-col gap-2 p-4">
                <div className="text-sm text-gray-300">
                    Pack Format: {packFormat} | Version: {version.id}
                </div>
                <div className="text-xs text-gray-500">Open a JSON file in the data folder to start editing.</div>
            </div>
        );
    }

    return <JsonFileView docAndNode={docAndNode} service={service} />;
}
