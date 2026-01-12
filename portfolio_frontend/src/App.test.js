import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login heading when unauthenticated", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
});
