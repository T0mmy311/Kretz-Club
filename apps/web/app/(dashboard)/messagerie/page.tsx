import { MessageSquare } from "lucide-react";

export default function MessageriePage() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="text-center text-muted-foreground">
        <MessageSquare className="mx-auto h-12 w-12 opacity-20" />
        <p className="mt-4 text-lg font-medium">
          {"Sélectionnez un channel"}
        </p>
        <p className="mt-1 text-sm">
          {"Choisissez un channel ou une conversation pour commencer à discuter"}
        </p>
      </div>
    </div>
  );
}
