import { MessageSquare, Construction } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";

export function Messages() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-semibold text-ink-900">Messages</h1>
      <p className="mt-1 text-sm text-ink-500">Conversations between clients and freelancers.</p>

      <div className="card mt-6 p-10">
        <EmptyState
          icon={Construction}
          title="Chat isn't connected yet"
          description={
            <>
              The backend currently only exposes a placeholder endpoint (
              <code className="rounded bg-canvas px-1.5 py-0.5 text-xs">GET /chat/test</code>) with
              no real WebSocket route or message schema. This screen is built and ready to wire
              up — once a chat endpoint and message format are added to the API, the sidebar,
              message thread, and composer below can go live without a redesign.
            </>
          }
        />

        <div className="mt-8 grid gap-4 opacity-40 sm:grid-cols-[220px_1fr]" aria-hidden="true">
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-line p-2.5">
                <span className="h-8 w-8 rounded-full bg-line" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-3/4 rounded bg-line" />
                  <div className="h-2 w-1/2 rounded bg-line" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-between rounded-lg border border-line p-4">
            <div className="flex items-center gap-2 text-ink-400">
              <MessageSquare size={16} />
              <span className="text-sm">Conversation preview</span>
            </div>
            <div className="h-10 rounded-lg border border-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
