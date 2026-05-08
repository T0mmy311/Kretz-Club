"use client";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";
import { MapPin } from "lucide-react";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type Investment = {
  id: string;
  title: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  targetAmount: any;
};

export function InvestmentMap({ investments }: { investments: Investment[] }) {
  const [selected, setSelected] = useState<Investment | null>(null);

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "pk.PLACEHOLDER") {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        Configurez NEXT_PUBLIC_MAPBOX_TOKEN pour voir la carte
      </div>
    );
  }

  const validInvestments = investments.filter((i) => i.latitude && i.longitude);
  if (validInvestments.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        Aucun investissement g&eacute;olocalis&eacute;
      </div>
    );
  }

  return (
    <div className="h-[600px] overflow-hidden rounded-xl border border-border">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ longitude: 2.5, latitude: 46.5, zoom: 5 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        {validInvestments.map((inv) => (
          <Marker
            key={inv.id}
            longitude={inv.longitude!}
            latitude={inv.latitude!}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(inv);
            }}
          >
            <div className="cursor-pointer rounded-full bg-yellow-500 p-1.5 shadow-lg ring-2 ring-yellow-300/50 transition-transform hover:scale-110">
              <MapPin className="h-4 w-4 text-black" />
            </div>
          </Marker>
        ))}
        {selected && (
          <Popup
            longitude={selected.longitude!}
            latitude={selected.latitude!}
            anchor="bottom"
            onClose={() => setSelected(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <Link href={`/investissements/${selected.id}`} className="block p-1">
              <div className="text-sm font-semibold text-black">{selected.title}</div>
              {selected.location && (
                <div className="mt-1 text-xs text-zinc-600">{selected.location}</div>
              )}
            </Link>
          </Popup>
        )}
      </Map>
    </div>
  );
}
