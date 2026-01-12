import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ProjectsPage from "../pages/ProjectsPage";
import SkillsPage from "../pages/SkillsPage";
import ProfilePage from "../pages/ProfilePage";
import ContactPage from "../pages/ContactPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import AdminContactInboxPage from "../pages/AdminContactInboxPage";

// Mock API client module used by pages
jest.mock("../api/client", () => ({
  api: {
    projects: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    skills: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    profile: {
      getMe: jest.fn(),
      updateMe: jest.fn(),
    },
    contact: {
      submitMessage: jest.fn(),
      listMessages: jest.fn(),
      updateMessage: jest.fn(),
    },
    admin: {
      listUsers: jest.fn(),
    },
  },
  configureApiClient: jest.fn(),
  getApiBaseUrl: jest.fn(() => "http://test"),
  ApiError: class ApiError extends Error {},
}));

jest.mock("../ui/ToastContext", () => ({
  useToast: () => ({
    pushToast: jest.fn(),
  }),
}));

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const { api } = require("../api/client");
const { useAuth } = require("../auth/AuthContext");

beforeEach(() => {
  jest.clearAllMocks();
});

test("ProjectsPage loads list and can create a project", async () => {
  api.projects.list
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 1, title: "New Project", status: "draft", skills: [] }]);
  api.skills.list.mockResolvedValue([{ id: 10, name: "JS" }]);
  api.projects.create.mockResolvedValue({ id: 1 });

  render(<ProjectsPage />);

  expect(await screen.findByText(/no projects found/i)).toBeInTheDocument();

  // Use placeholder-less inputs: target by label text *node* then adjacent input
  const titleInput = screen.getByText("Title").parentElement.querySelector("input");
  fireEvent.change(titleInput, { target: { value: "New Project" } });

  fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

  await waitFor(() => expect(api.projects.create).toHaveBeenCalled());
  await waitFor(() => expect(api.projects.list).toHaveBeenCalledTimes(2));
});

test("SkillsPage (admin) can create a skill", async () => {
  useAuth.mockReturnValue({ role: "admin" });

  api.skills.list.mockResolvedValueOnce([]);
  api.skills.create.mockResolvedValueOnce({ id: 5 });
  api.skills.list.mockResolvedValueOnce([{ id: 5, name: "Python", category: "Backend", level: 4 }]);

  render(<SkillsPage />);

  expect(await screen.findByText(/no skills found/i)).toBeInTheDocument();

  const nameInput = screen.getByText("Name").parentElement.querySelector("input");
  fireEvent.change(nameInput, { target: { value: "Python" } });

  fireEvent.change(screen.getByPlaceholderText(/frontend, backend, devops/i), { target: { value: "Backend" } });
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "4" } });

  fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
  await waitFor(() => expect(api.skills.create).toHaveBeenCalled());
});

test("ProfilePage saves profile changes (valid socials JSON)", async () => {
  useAuth.mockReturnValue({
    profile: {
      display_name: "Old",
      headline: "",
      bio: "",
      location: "",
      website: "",
      socials: {},
    },
    refreshProfile: jest.fn().mockResolvedValue(undefined),
    setProfile: jest.fn(),
  });

  api.profile.updateMe.mockResolvedValue({
    display_name: "New Name",
    socials: { github: "https://github.com/x" },
  });

  render(<ProfilePage />);

  // The UI uses <div className="label"> without htmlFor, so use DOM proximity.
  const displayNameInput = screen.getByText("Display name").parentElement.querySelector("input");
  fireEvent.change(displayNameInput, { target: { value: "New Name" } });

  const socialsTextarea = screen.getByText(/socials \(json\)/i).parentElement.querySelector("textarea");
  fireEvent.change(socialsTextarea, { target: { value: "{\"github\":\"https://github.com/x\"}" } });

  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  await waitFor(() => expect(api.profile.updateMe).toHaveBeenCalled());
});

test("ContactPage submits a message successfully", async () => {
  api.contact.submitMessage.mockResolvedValueOnce({ id: 1 });

  render(<ContactPage />);

  const nameInput = screen.getByText("Name").parentElement.querySelector("input");
  fireEvent.change(nameInput, { target: { value: "Alice" } });

  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "alice@example.com" } });

  const messageTextarea = screen.getByText("Message").parentElement.querySelector("textarea");
  fireEvent.change(messageTextarea, { target: { value: "This is a sufficiently long message." } });

  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  await waitFor(() => expect(api.contact.submitMessage).toHaveBeenCalled());
});

test("AdminUsersPage loads users list", async () => {
  api.admin.listUsers.mockResolvedValueOnce([
    { id: 1, email: "a@b.com", username: "a", role: "admin", created_at: new Date().toISOString() },
  ]);

  render(<AdminUsersPage />);

  // Avoid ambiguous /users/i matches: check the heading row content and the email.
  expect(await screen.findByText("a@b.com")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
});

test("AdminContactInboxPage loads messages and updates status on select change", async () => {
  api.contact.listMessages
    .mockResolvedValueOnce([
      {
        id: 1,
        sender_name: "Bob",
        sender_email: "bob@example.com",
        subject: null,
        message: "Hi",
        status: "new",
        created_at: new Date().toISOString(),
      },
    ])
    .mockResolvedValueOnce([
      {
        id: 1,
        sender_name: "Bob",
        sender_email: "bob@example.com",
        subject: null,
        message: "Hi",
        status: "resolved",
        created_at: new Date().toISOString(),
      },
    ]);

  api.contact.updateMessage.mockResolvedValueOnce({});

  render(<AdminContactInboxPage />);

  expect(await screen.findByText(/contact messages/i)).toBeInTheDocument();
  expect(await screen.findByText("bob@example.com")).toBeInTheDocument();

  // There is one <select> per row; with one row it's safe to grab by role.
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "resolved" } });

  await waitFor(() => expect(api.contact.updateMessage).toHaveBeenCalledWith(1, { status: "resolved" }));
  await waitFor(() => expect(api.contact.listMessages).toHaveBeenCalledTimes(2));
});
