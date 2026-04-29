import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModelSelector } from "@/app/components/ModelSelector";

describe("ModelSelector", () => {
  it("renders the current model", () => {
    render(<ModelSelector value="claude-sonnet-4-6" onChange={() => {}} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("claude-sonnet-4-6");
  });

  it("offers both supported models", () => {
    render(<ModelSelector value="claude-sonnet-4-6" onChange={() => {}} />);
    expect(screen.getByRole("option", { name: /sonnet/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /opus/i })).toBeInTheDocument();
  });

  it("calls onChange when the selection changes", async () => {
    const onChange = vi.fn();
    render(<ModelSelector value="claude-sonnet-4-6" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "claude-opus-4-7");
    expect(onChange).toHaveBeenCalledWith("claude-opus-4-7");
  });
});
