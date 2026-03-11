import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssistantStatus } from "@/components/assistant-status";
import { QuickActions } from "@/components/quick-actions";

// ── AssistantStatus ───────────────────────────────────────────────────────────

describe("AssistantStatus", () => {
  it("renders Online badge when online=true", () => {
    render(
      <AssistantStatus
        online={true}
        health="ok"
        sessionCount={2}
      />
    );
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("renders Offline badge when online=false", () => {
    render(
      <AssistantStatus
        online={false}
        health="degraded"
        sessionCount={0}
      />
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("renders model name when provided", () => {
    render(
      <AssistantStatus
        online={true}
        health="ok"
        sessionCount={0}
        model="gpt-4o"
      />
    );
    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
  });

  it("renders — when model is undefined", () => {
    render(
      <AssistantStatus online={false} health="unknown" sessionCount={0} />
    );
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("formats uptime under 60s correctly", () => {
    render(
      <AssistantStatus
        online={true}
        health="ok"
        sessionCount={0}
        uptime={45}
      />
    );
    expect(screen.getByText("45s")).toBeInTheDocument();
  });

  it("formats uptime in minutes correctly", () => {
    render(
      <AssistantStatus
        online={true}
        health="ok"
        sessionCount={0}
        uptime={130}
      />
    );
    expect(screen.getByText("2m")).toBeInTheDocument();
  });

  it("formats uptime in hours correctly", () => {
    render(
      <AssistantStatus
        online={true}
        health="ok"
        sessionCount={0}
        uptime={3700}
      />
    );
    expect(screen.getByText("1h 1m")).toBeInTheDocument();
  });

  it("renders health status with accessible role", () => {
    render(
      <AssistantStatus online={false} health="error" sessionCount={0} />
    );
    const el = screen.getByRole("status", { name: "Health: error" });
    expect(el).toBeInTheDocument();
    expect(el.textContent).toBe("error");
  });

  it("renders lastChecked time when provided", () => {
    render(
      <AssistantStatus
        online={true}
        health="ok"
        sessionCount={0}
        lastChecked="2024-01-01T14:30:00.000Z"
      />
    );
    // Time should appear somewhere in the document
    const el = document.querySelector("[title='Last checked']");
    expect(el).toBeInTheDocument();
  });

  it("renders session count correctly", () => {
    render(
      <AssistantStatus online={true} health="ok" sessionCount={5} />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});

// ── QuickActions ──────────────────────────────────────────────────────────────

describe("QuickActions — heartbeat toggle", () => {
  it("renders Heartbeat On by default", () => {
    render(<QuickActions gatewayConfigured={true} />);
    expect(screen.getByText("Heartbeat On")).toBeInTheDocument();
  });

  it("toggles to Off on click and shows feedback", async () => {
    render(<QuickActions gatewayConfigured={true} />);
    fireEvent.click(screen.getByText("Heartbeat On"));
    expect(screen.getByText("Heartbeat Off")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Heartbeat disabled.")
    );
  });

  it("toggles back to On on second click", () => {
    render(<QuickActions gatewayConfigured={true} />);
    const btn = screen.getByText("Heartbeat On");
    fireEvent.click(btn);
    fireEvent.click(screen.getByText("Heartbeat Off"));
    expect(screen.getByText("Heartbeat On")).toBeInTheDocument();
  });
});

describe("QuickActions — restart with confirmation", () => {
  it("shows confirmation dialog on restart click", () => {
    render(<QuickActions gatewayConfigured={true} />);
    fireEvent.click(screen.getByText("Restart"));
    expect(screen.getByText("Restart assistant?")).toBeInTheDocument();
    expect(screen.getByText("Yes, restart")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("returns to idle on cancel", () => {
    render(<QuickActions gatewayConfigured={true} />);
    fireEvent.click(screen.getByText("Restart"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Restart")).toBeInTheDocument();
    expect(screen.queryByText("Restart assistant?")).not.toBeInTheDocument();
  });

  it("shows Restarting… during restart and success after", async () => {
    render(<QuickActions gatewayConfigured={true} />);
    fireEvent.click(screen.getByText("Restart"));
    fireEvent.click(screen.getByText("Yes, restart"));
    expect(screen.getByText("Restarting…")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Restarted")).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Assistant restarted successfully."
    );
  });

  it("restart button is disabled when gateway not configured", () => {
    render(<QuickActions gatewayConfigured={false} />);
    const btn = screen.getByText("Restart").closest("button");
    expect(btn).toBeDisabled();
  });

  it("shows gateway hint when not configured", () => {
    render(<QuickActions gatewayConfigured={false} />);
    expect(screen.getByText(/OPENCLAW_GATEWAY_URL/)).toBeInTheDocument();
  });
});
