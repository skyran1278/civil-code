import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AskForm } from "@/app/components/AskForm";

describe("AskForm", () => {
  it("renders an input and a submit button", () => {
    render(<AskForm onSubmit={() => {}} loading={false} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /送出|submit/i })).toBeInTheDocument();
  });

  it("calls onSubmit with the trimmed question", async () => {
    const onSubmit = vi.fn();
    render(<AskForm onSubmit={onSubmit} loading={false} />);
    await userEvent.type(screen.getByRole("textbox"), "  箍筋最大間距?  ");
    await userEvent.click(screen.getByRole("button", { name: /送出/ }));
    expect(onSubmit).toHaveBeenCalledWith("箍筋最大間距?");
  });

  it("does not call onSubmit when the question is empty or whitespace", async () => {
    const onSubmit = vi.fn();
    render(<AskForm onSubmit={onSubmit} loading={false} />);
    await userEvent.click(screen.getByRole("button", { name: /送出/ }));
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole("textbox"), "   ");
    await userEvent.click(screen.getByRole("button", { name: /送出/ }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables the submit button while loading", () => {
    render(<AskForm onSubmit={() => {}} loading={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
