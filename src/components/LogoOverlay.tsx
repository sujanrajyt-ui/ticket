"use client";

import { useEventConfig } from "./EventConfigProvider";

export default function LogoOverlay() {
    const { settings } = useEventConfig();
    if (!settings.logoUrl) return null;
    return (
        <div className="fixed top-3 left-3 z-50 pointer-events-none">
            <img
                src={settings.logoUrl}
                alt="Vista Logo"
                className="h-12 w-auto md:h-14 drop-shadow-lg"
                draggable={false}
            />
        </div>
    );
}
